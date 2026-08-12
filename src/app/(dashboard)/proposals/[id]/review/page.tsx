import { notFound } from "next/navigation";
import { ReviewEditor } from "@/components/dashboard/review-editor";
import type { JsonValue } from "@/components/dashboard/section-editor";
import { getProposalWithRelations } from "@/lib/proposal/queries";

export default async function ReviewProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposal = await getProposalWithRelations(id);
  if (!proposal) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review &amp; edit</h1>
        <p className="text-sm text-muted-foreground">
          {proposal.client_company} — review the AI-drafted narrative before publishing.
        </p>
      </div>
      <ReviewEditor
        proposalId={proposal.id}
        initialContent={proposal.proposal_content.map((row) => ({
          section_key: row.section_key,
          content: row.content as JsonValue,
        }))}
      />
    </div>
  );
}
