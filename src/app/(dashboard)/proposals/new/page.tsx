import { ProposalForm } from "@/components/dashboard/proposal-form";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { createClient } from "@/lib/supabase/server";

export default async function NewProposalPage() {
  const { organization } = await requireCurrentOrg();
  const supabase = await createClient();
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("org_id", organization.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New proposal</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the essentials — AI will draft the narrative sections next.
        </p>
      </div>
      <ProposalForm mode="create" orgTeamMembers={teamMembers ?? []} />
    </div>
  );
}
