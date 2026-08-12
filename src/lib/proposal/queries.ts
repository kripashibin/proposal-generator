import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Proposal, ProposalWithRelations } from "@/lib/proposal/types";

export async function listProposals(): Promise<Proposal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Fetches a proposal and its related rows via separate queries rather than a
// single embedded-join select. The hand-written Database type (see
// database.types.ts) doesn't declare FK Relationships metadata, so
// postgrest-js can't type-infer embedded resources — separate queries avoid
// that entirely and are simple enough for an admin-page fetch.
export async function getProposalWithRelations(
  id: string,
): Promise<ProposalWithRelations | null> {
  const supabase = await createClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!proposal) return null;

  const [
    { data: organization, error: orgError },
    { data: pricingLineItems, error: lineItemsError },
    { data: proposalTeamMembers, error: teamError },
    { data: proposalContent, error: contentError },
  ] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", proposal.org_id).single(),
    supabase
      .from("pricing_line_items")
      .select("*")
      .eq("proposal_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("proposal_team_members")
      .select("*")
      .eq("proposal_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("proposal_content")
      .select("*")
      .eq("proposal_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (orgError) throw orgError;
  if (lineItemsError) throw lineItemsError;
  if (teamError) throw teamError;
  if (contentError) throw contentError;
  if (!organization) throw new Error("Organization not found for proposal");

  return {
    ...proposal,
    organizations: organization,
    pricing_line_items: pricingLineItems ?? [],
    proposal_team_members: proposalTeamMembers ?? [],
    proposal_content: proposalContent ?? [],
  };
}
