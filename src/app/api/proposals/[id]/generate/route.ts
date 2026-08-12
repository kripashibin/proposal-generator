import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import {
  generateFullProposalContent,
  regenerateProposalSection,
  type GenerationInput,
} from "@/lib/gemini/generateProposalContent";
import { SECTION_ORDER, contentKeyForSection, type SectionKey } from "@/lib/proposal/content-schema";
import { totalAmountCents } from "@/lib/proposal/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: proposalId } = await params;
  const { organization } = await requireCurrentOrg();
  const supabase = await createClient();

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .eq("org_id", organization.id)
    .single();

  if (proposalError || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const [{ data: lineItems }, { data: teamMembers }] = await Promise.all([
    supabase.from("pricing_line_items").select("*").eq("proposal_id", proposalId),
    supabase.from("proposal_team_members").select("*").eq("proposal_id", proposalId),
  ]);

  const generationInput: GenerationInput = {
    organizationName: organization.name,
    clientCompany: proposal.client_company,
    clientContactName: proposal.client_contact_name,
    eyebrowText: proposal.eyebrow_text,
    proposalDate: proposal.proposal_date,
    validForDays: proposal.valid_for_days,
    currency: proposal.currency,
    briefDescription: proposal.brief_description,
    lineItems: (lineItems ?? []).map((item) => ({
      itemName: item.item_name,
      description: item.description,
      amountCents: item.amount_cents,
    })),
    totalAmountCents: totalAmountCents(lineItems ?? []),
    amountDueCents: proposal.amount_due_cents,
    paymentType: proposal.payment_type,
    teamMembers: (teamMembers ?? []).map((member) => ({
      name: member.name,
      role: member.role,
      description: member.description,
    })),
  };

  let body: { sections?: SectionKey[] } = {};
  try {
    body = await request.json();
  } catch {
    // no body — generate everything
  }

  try {
    const returnedContent: Partial<Record<SectionKey, Record<string, unknown>>> = {};

    if (body.sections && body.sections.length > 0) {
      for (const section of body.sections) {
        const partial = await regenerateProposalSection(generationInput, section);
        const content = Object.values(partial)[0] as { headline?: string; subhead?: string };
        const sortOrder = SECTION_ORDER.indexOf(section);
        const { error } = await supabase.from("proposal_content").upsert(
          {
            proposal_id: proposalId,
            section_key: section,
            sort_order: sortOrder,
            content: content as Record<string, unknown>,
          },
          { onConflict: "proposal_id,section_key" },
        );
        if (error) throw error;
        returnedContent[section] = content as Record<string, unknown>;

        if (section === "cover") {
          await supabase
            .from("proposals")
            .update({ headline: content.headline, subhead: content.subhead })
            .eq("id", proposalId);
        }
      }
    } else {
      const full = await generateFullProposalContent(generationInput);
      const fullRecord = full as unknown as Record<string, Record<string, unknown>>;
      const rows = SECTION_ORDER.map((section, index) => {
        const content = fullRecord[contentKeyForSection(section)];
        returnedContent[section] = content;
        return {
          proposal_id: proposalId,
          section_key: section,
          sort_order: index,
          content,
        };
      });
      const { error } = await supabase
        .from("proposal_content")
        .upsert(rows, { onConflict: "proposal_id,section_key" });
      if (error) throw error;

      await supabase
        .from("proposals")
        .update({ headline: full.cover.headline, subhead: full.cover.subhead })
        .eq("id", proposalId);
    }

    return NextResponse.json({ ok: true, content: returnedContent });
  } catch (err) {
    console.error("Proposal generation failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 },
    );
  }
}
