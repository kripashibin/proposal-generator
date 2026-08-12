import { notFound } from "next/navigation";
import { ProposalForm } from "@/components/dashboard/proposal-form";
import { getProposalWithRelations } from "@/lib/proposal/queries";
import { centsToDollarsInput } from "@/lib/proposal/money";
import type { ProposalFormInput } from "@/lib/proposal/actions";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposal = await getProposalWithRelations(id);
  if (!proposal) notFound();

  const defaultValues: Partial<ProposalFormInput> = {
    clientCompany: proposal.client_company,
    clientContactName: proposal.client_contact_name ?? "",
    clientEmail: proposal.client_email ?? "",
    eyebrowText: proposal.eyebrow_text,
    proposalDate: proposal.proposal_date,
    validForDays: proposal.valid_for_days,
    briefDescription: proposal.brief_description,
    paymentType: proposal.payment_type,
    amountDueDollars: Number(centsToDollarsInput(proposal.amount_due_cents)),
    lineItems: proposal.pricing_line_items
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        itemName: item.item_name,
        description: item.description ?? "",
        amountDollars: Number(centsToDollarsInput(item.amount_cents)),
      })),
    teamMembers: proposal.proposal_team_members
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((member) => ({
        name: member.name,
        role: member.role ?? "",
        description: member.description ?? "",
      })),
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit proposal</h1>
        <p className="text-sm text-muted-foreground">{proposal.client_company}</p>
      </div>
      <ProposalForm
        mode="edit"
        proposalId={proposal.id}
        orgTeamMembers={[]}
        defaultValues={defaultValues}
      />
    </div>
  );
}
