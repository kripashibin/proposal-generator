import type { Database, ProposalStatus } from "@/lib/supabase/database.types";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type Proposal = Database["public"]["Tables"]["proposals"]["Row"];
export type ProposalContentRow = Database["public"]["Tables"]["proposal_content"]["Row"];
export type PricingLineItem = Database["public"]["Tables"]["pricing_line_items"]["Row"];
export type ProposalTeamMember = Database["public"]["Tables"]["proposal_team_members"]["Row"];
export type Signature = Database["public"]["Tables"]["signatures"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type ProposalEvent = Database["public"]["Tables"]["proposal_events"]["Row"];

export interface ProposalWithRelations extends Proposal {
  pricing_line_items: PricingLineItem[];
  proposal_team_members: ProposalTeamMember[];
  proposal_content: ProposalContentRow[];
  organizations: Organization;
}

export const STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  paid: "Paid",
  void: "Void",
  expired: "Expired",
};

export const STATUS_BADGE_VARIANT: Record<
  ProposalStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  sent: "secondary",
  viewed: "secondary",
  signed: "default",
  paid: "default",
  void: "destructive",
  expired: "destructive",
};

export function totalAmountCents(lineItems: Pick<PricingLineItem, "amount_cents">[]): number {
  return lineItems.reduce((sum, item) => sum + item.amount_cents, 0);
}

const TERMINAL_STATUSES: ProposalStatus[] = ["signed", "paid", "void", "expired"];

// The `status` column only flips to 'expired' opportunistically (when the
// owner or client next loads the proposal) rather than via a cron job, so
// list/detail views compute the *effective* status client-side to avoid
// showing a stale "Sent"/"Viewed" badge past the deadline.
export function effectiveStatus(
  proposal: Pick<Proposal, "status" | "expires_at">,
): ProposalStatus {
  if (TERMINAL_STATUSES.includes(proposal.status) || proposal.status === "draft") {
    return proposal.status;
  }
  if (proposal.expires_at && new Date(proposal.expires_at) < new Date()) {
    return "expired";
  }
  return proposal.status;
}
