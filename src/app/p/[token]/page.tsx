import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { totalAmountCents } from "@/lib/proposal/types";
import type {
  AgreementContent,
  ChallengesContent,
  CoverContent,
  ExecutiveSummaryContent,
  InvestmentContent,
  ScopeContent,
  SolutionContent,
  TeamContent,
  WhyUsContent,
} from "@/lib/proposal/content-schema";
import { Cover } from "@/components/proposal-template/Cover";
import { ExecutiveSummary } from "@/components/proposal-template/ExecutiveSummary";
import { CurrentChallenges } from "@/components/proposal-template/CurrentChallenges";
import { ProposedSolution } from "@/components/proposal-template/ProposedSolution";
import { WhyUs } from "@/components/proposal-template/WhyUs";
import { ScopeOfWork } from "@/components/proposal-template/ScopeOfWork";
import { Team } from "@/components/proposal-template/Team";
import { Investment } from "@/components/proposal-template/Investment";
import { AgreementNextSteps } from "@/components/proposal-template/AgreementNextSteps";
import { ProposalActionsPanel } from "@/components/public-proposal/proposal-actions-panel";
import { dmSans } from "@/styles/fonts";

export const dynamic = "force-dynamic";

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("public_token", token)
    .maybeSingle();

  if (!proposal || proposal.status === "draft") notFound();

  if (proposal.status === "void") {
    return <StatusMessage title="This proposal is no longer available." />;
  }

  const isExpired =
    proposal.expires_at &&
    new Date(proposal.expires_at) < new Date() &&
    !["signed", "paid"].includes(proposal.status);

  if (isExpired) {
    return <StatusMessage title="This proposal has expired." body="Please reach out to request an updated link." />;
  }

  const [
    { data: organization },
    { data: lineItemRows },
    { data: teamMemberRows },
    { data: contentRows },
    { data: signatureRows },
  ] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", proposal.org_id).single(),
    supabase
      .from("pricing_line_items")
      .select("*")
      .eq("proposal_id", proposal.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("proposal_team_members")
      .select("*")
      .eq("proposal_id", proposal.id)
      .order("sort_order", { ascending: true }),
    supabase.from("proposal_content").select("*").eq("proposal_id", proposal.id),
    supabase.from("signatures").select("*").eq("proposal_id", proposal.id).order("signed_at", { ascending: false }).limit(1),
  ]);

  if (!organization || !contentRows || contentRows.length < 9) {
    notFound();
  }

  // Idempotent "viewed" tracking — only transitions sent -> viewed once.
  if (proposal.status === "sent") {
    await supabase
      .from("proposals")
      .update({ status: "viewed", first_viewed_at: new Date().toISOString() })
      .eq("id", proposal.id);
    await supabase
      .from("proposal_events")
      .insert({ proposal_id: proposal.id, event_type: "viewed" });
  } else if (!proposal.first_viewed_at) {
    await supabase
      .from("proposals")
      .update({ first_viewed_at: new Date().toISOString() })
      .eq("id", proposal.id);
  }

  const contentBySection = Object.fromEntries(
    contentRows.map((row) => [row.section_key, row.content]),
  ) as Record<string, Record<string, unknown>>;

  const lineItems = (lineItemRows ?? []).map((item) => ({
    itemName: item.item_name,
    description: item.description,
    amountCents: item.amount_cents,
  }));
  const teamMembers = (teamMemberRows ?? []).map((member) => ({
    name: member.name,
    role: member.role,
    description: member.description,
  }));
  const totalCents = totalAmountCents(lineItemRows ?? []);
  const signature = signatureRows?.[0] ?? null;

  const panelStatus = proposal.status === "paid" ? "paid" : signature ? "signed" : "unsigned";

  return (
    <div className={`${dmSans.className} min-h-screen bg-[#f7f8fa]`}>
      <Cover
        content={contentBySection.cover as unknown as CoverContent}
        eyebrowText={proposal.eyebrow_text}
        clientCompany={proposal.client_company}
        organizationName={organization.name}
        proposalDate={proposal.proposal_date}
        validForDays={proposal.valid_for_days}
      />
      <ExecutiveSummary
        content={contentBySection.executive_summary as unknown as ExecutiveSummaryContent}
        organizationName={organization.name}
      />
      <CurrentChallenges
        content={contentBySection.challenges as unknown as ChallengesContent}
        organizationName={organization.name}
      />
      <ProposedSolution
        content={contentBySection.solution as unknown as SolutionContent}
        organizationName={organization.name}
      />
      <WhyUs
        content={contentBySection.why_us as unknown as WhyUsContent}
        organizationName={organization.name}
      />
      <ScopeOfWork
        content={contentBySection.scope as unknown as ScopeContent}
        organizationName={organization.name}
      />
      <Team
        content={contentBySection.team as unknown as TeamContent}
        organizationName={organization.name}
        teamMembers={teamMembers}
      />
      <Investment
        content={contentBySection.investment as unknown as InvestmentContent}
        organizationName={organization.name}
        currency={proposal.currency}
        lineItems={lineItems}
        totalCents={totalCents}
        amountDueCents={proposal.amount_due_cents}
        paymentType={proposal.payment_type}
      />
      <AgreementNextSteps
        content={contentBySection.agreement as unknown as AgreementContent}
        organizationName={organization.name}
        sentDate={proposal.sent_at}
        contactEmail={organization.contact_email}
        contactPhone={organization.contact_phone}
        schedulingLink={organization.scheduling_link}
        signatureSlot={
          <ProposalActionsPanel
            publicToken={proposal.public_token}
            initialStatus={panelStatus}
            initialSignerName={signature?.signer_name ?? null}
            initialSignedAt={signature?.signed_at ?? null}
            amountDueCents={proposal.amount_due_cents}
            currency={proposal.currency}
          />
        }
      />
    </div>
  );
}

function StatusMessage({ title, body }: { title: string; body?: string }) {
  return (
    <div className={`${dmSans.className} flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6`}>
      <div className="max-w-md text-center">
        <p className="text-lg font-semibold text-[#0a0a0c]">{title}</p>
        {body ? <p className="mt-2 text-sm text-[#525a66]">{body}</p> : null}
      </div>
    </div>
  );
}
