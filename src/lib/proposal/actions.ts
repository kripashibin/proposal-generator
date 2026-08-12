"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { generatePublicToken } from "@/lib/proposal/slug";
import type { SectionKey } from "@/lib/proposal/content-schema";

export interface ProposalLineItemInput {
  itemName: string;
  description: string;
  amountDollars: number;
}

export interface ProposalTeamMemberInput {
  name: string;
  role: string;
  description: string;
}

export interface ProposalFormInput {
  clientCompany: string;
  clientContactName: string;
  clientEmail: string;
  eyebrowText: string;
  proposalDate: string;
  validForDays: number;
  briefDescription: string;
  paymentType: "full" | "deposit" | "custom";
  amountDueDollars: number;
  lineItems: ProposalLineItemInput[];
  teamMembers: ProposalTeamMemberInput[];
}

export async function logProposalEvent(
  proposalId: string,
  eventType:
    | "created"
    | "sent"
    | "viewed"
    | "signed"
    | "paid"
    | "voided"
    | "resent"
    | "duplicated"
    | "expired",
  metadata?: Record<string, unknown>,
) {
  const supabase = await createClient();
  await supabase
    .from("proposal_events")
    .insert({ proposal_id: proposalId, event_type: eventType, metadata: metadata ?? null });
}

export async function createProposal(input: ProposalFormInput): Promise<{ id: string }> {
  const { organization, userId } = await requireCurrentOrg();
  const supabase = await createClient();

  const validLineItems = input.lineItems.filter((item) => item.itemName.trim().length > 0);
  const validTeamMembers = input.teamMembers.filter((member) => member.name.trim().length > 0);

  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      org_id: organization.id,
      created_by: userId,
      public_token: generatePublicToken(),
      status: "draft",
      client_company: input.clientCompany,
      client_contact_name: input.clientContactName || null,
      client_email: input.clientEmail || null,
      eyebrow_text: input.eyebrowText || "PROJECT PROPOSAL",
      proposal_date: input.proposalDate,
      valid_for_days: input.validForDays,
      currency: "USD",
      amount_due_cents: Math.round(input.amountDueDollars * 100),
      payment_type: input.paymentType,
      brief_description: input.briefDescription,
    })
    .select("id")
    .single();

  if (error || !proposal) throw error ?? new Error("Failed to create proposal");

  if (validLineItems.length > 0) {
    const { error: lineItemsError } = await supabase.from("pricing_line_items").insert(
      validLineItems.map((item, index) => ({
        proposal_id: proposal.id,
        sort_order: index,
        item_name: item.itemName,
        description: item.description || null,
        amount_cents: Math.round(item.amountDollars * 100),
      })),
    );
    if (lineItemsError) throw lineItemsError;
  }

  if (validTeamMembers.length > 0) {
    const { error: teamError } = await supabase.from("proposal_team_members").insert(
      validTeamMembers.map((member, index) => ({
        proposal_id: proposal.id,
        sort_order: index,
        name: member.name,
        role: member.role || null,
        description: member.description || null,
      })),
    );
    if (teamError) throw teamError;
  }

  await logProposalEvent(proposal.id, "created");
  revalidatePath("/dashboard");

  return { id: proposal.id };
}

export async function updateProposalDraft(
  proposalId: string,
  input: ProposalFormInput,
): Promise<void> {
  await requireCurrentOrg();
  const supabase = await createClient();

  const validLineItems = input.lineItems.filter((item) => item.itemName.trim().length > 0);
  const validTeamMembers = input.teamMembers.filter((member) => member.name.trim().length > 0);

  const { error } = await supabase
    .from("proposals")
    .update({
      client_company: input.clientCompany,
      client_contact_name: input.clientContactName || null,
      client_email: input.clientEmail || null,
      eyebrow_text: input.eyebrowText || "PROJECT PROPOSAL",
      proposal_date: input.proposalDate,
      valid_for_days: input.validForDays,
      amount_due_cents: Math.round(input.amountDueDollars * 100),
      payment_type: input.paymentType,
      brief_description: input.briefDescription,
    })
    .eq("id", proposalId);

  if (error) throw error;

  await supabase.from("pricing_line_items").delete().eq("proposal_id", proposalId);
  if (validLineItems.length > 0) {
    const { error: lineItemsError } = await supabase.from("pricing_line_items").insert(
      validLineItems.map((item, index) => ({
        proposal_id: proposalId,
        sort_order: index,
        item_name: item.itemName,
        description: item.description || null,
        amount_cents: Math.round(item.amountDollars * 100),
      })),
    );
    if (lineItemsError) throw lineItemsError;
  }

  await supabase.from("proposal_team_members").delete().eq("proposal_id", proposalId);
  if (validTeamMembers.length > 0) {
    const { error: teamError } = await supabase.from("proposal_team_members").insert(
      validTeamMembers.map((member, index) => ({
        proposal_id: proposalId,
        sort_order: index,
        name: member.name,
        role: member.role || null,
        description: member.description || null,
      })),
    );
    if (teamError) throw teamError;
  }

  revalidatePath(`/proposals/${proposalId}`);
}

export async function duplicateProposal(proposalId: string): Promise<{ id: string }> {
  const { organization, userId } = await requireCurrentOrg();
  const supabase = await createClient();

  const { data: original, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (error || !original) throw error ?? new Error("Proposal not found");

  const [{ data: lineItems }, { data: teamMembers }, { data: contentRows }] = await Promise.all([
    supabase.from("pricing_line_items").select("*").eq("proposal_id", proposalId),
    supabase.from("proposal_team_members").select("*").eq("proposal_id", proposalId),
    supabase.from("proposal_content").select("*").eq("proposal_id", proposalId),
  ]);

  const { data: copy, error: copyError } = await supabase
    .from("proposals")
    .insert({
      org_id: organization.id,
      created_by: userId,
      public_token: generatePublicToken(),
      status: "draft",
      client_company: original.client_company,
      client_contact_name: original.client_contact_name,
      client_email: original.client_email,
      eyebrow_text: original.eyebrow_text,
      headline: original.headline,
      subhead: original.subhead,
      proposal_date: new Date().toISOString().slice(0, 10),
      valid_for_days: original.valid_for_days,
      currency: original.currency,
      amount_due_cents: original.amount_due_cents,
      payment_type: original.payment_type,
      brief_description: original.brief_description,
    })
    .select("id")
    .single();

  if (copyError || !copy) throw copyError ?? new Error("Failed to duplicate proposal");

  if (lineItems && lineItems.length > 0) {
    await supabase.from("pricing_line_items").insert(
      lineItems.map((item) => ({
        proposal_id: copy.id,
        sort_order: item.sort_order,
        item_name: item.item_name,
        description: item.description,
        amount_cents: item.amount_cents,
      })),
    );
  }

  if (teamMembers && teamMembers.length > 0) {
    await supabase.from("proposal_team_members").insert(
      teamMembers.map((member) => ({
        proposal_id: copy.id,
        sort_order: member.sort_order,
        name: member.name,
        role: member.role,
        description: member.description,
        photo_url: member.photo_url,
      })),
    );
  }

  if (contentRows && contentRows.length > 0) {
    await supabase.from("proposal_content").insert(
      contentRows.map((row) => ({
        proposal_id: copy.id,
        section_key: row.section_key,
        sort_order: row.sort_order,
        content: row.content,
      })),
    );
  }

  await logProposalEvent(copy.id, "created");
  await logProposalEvent(copy.id, "duplicated", { source_proposal_id: proposalId });
  revalidatePath("/dashboard");

  return { id: copy.id };
}

export async function voidProposal(proposalId: string): Promise<void> {
  await requireCurrentOrg();
  const supabase = await createClient();

  const { error } = await supabase
    .from("proposals")
    .update({ status: "void" })
    .eq("id", proposalId);

  if (error) throw error;
  await logProposalEvent(proposalId, "voided");
  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath("/dashboard");
}

export async function markProposalResent(proposalId: string): Promise<void> {
  await requireCurrentOrg();
  await logProposalEvent(proposalId, "resent");
  revalidatePath(`/proposals/${proposalId}`);
}

export async function deleteDraftProposal(proposalId: string): Promise<void> {
  await requireCurrentOrg();
  const supabase = await createClient();
  const { error } = await supabase
    .from("proposals")
    .delete()
    .eq("id", proposalId)
    .eq("status", "draft");
  if (error) throw error;
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateProposalContentSection(
  proposalId: string,
  section: SectionKey,
  content: Record<string, unknown>,
): Promise<void> {
  await requireCurrentOrg();
  const supabase = await createClient();

  const { error } = await supabase
    .from("proposal_content")
    .update({ content })
    .eq("proposal_id", proposalId)
    .eq("section_key", section);

  if (error) throw error;

  if (section === "cover") {
    const cover = content as { headline?: string; subhead?: string };
    await supabase
      .from("proposals")
      .update({ headline: cover.headline, subhead: cover.subhead })
      .eq("id", proposalId);
  }

  revalidatePath(`/proposals/${proposalId}/review`);
}

export async function publishProposal(proposalId: string): Promise<void> {
  await requireCurrentOrg();
  const supabase = await createClient();

  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("valid_for_days")
    .eq("id", proposalId)
    .single();
  if (fetchError || !proposal) throw fetchError ?? new Error("Proposal not found");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + proposal.valid_for_days * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from("proposals")
    .update({
      status: "sent",
      sent_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", proposalId);

  if (error) throw error;

  await logProposalEvent(proposalId, "sent");
  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath("/dashboard");
}
