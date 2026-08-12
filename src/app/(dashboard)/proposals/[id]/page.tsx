import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ProposalActions } from "@/components/dashboard/proposal-actions";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { getProposalWithRelations } from "@/lib/proposal/queries";
import { formatCents } from "@/lib/proposal/money";
import { effectiveStatus, totalAmountCents } from "@/lib/proposal/types";
import { createClient } from "@/lib/supabase/server";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposal = await getProposalWithRelations(id);
  if (!proposal) notFound();

  const supabase = await createClient();

  const displayStatus = effectiveStatus(proposal);
  if (displayStatus === "expired" && proposal.status !== "expired") {
    await supabase.from("proposals").update({ status: "expired" }).eq("id", id);
    await supabase.from("proposal_events").insert({ proposal_id: id, event_type: "expired" });
  }

  const [{ data: events }, { data: signatures }, { data: payments }] = await Promise.all([
    supabase
      .from("proposal_events")
      .select("*")
      .eq("proposal_id", id)
      .order("occurred_at", { ascending: false }),
    supabase.from("signatures").select("*").eq("proposal_id", id),
    supabase
      .from("payments")
      .select("*")
      .eq("proposal_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const total = totalAmountCents(proposal.pricing_line_items);
  const hasContent = proposal.proposal_content.length > 0;
  const publicUrl =
    typeof process !== "undefined"
      ? `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/p/${proposal.public_token}`
      : "";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{proposal.client_company}</h1>
            <StatusBadge status={displayStatus} />
          </div>
          {proposal.headline ? (
            <p className="mt-1 text-sm text-muted-foreground">{proposal.headline}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {proposal.status === "draft" ? (
            <Button render={<Link href={`/proposals/${proposal.id}/edit`} />} variant="outline">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          ) : null}
          {proposal.status === "draft" ? (
            <Button render={<Link href={`/proposals/${proposal.id}/review`} />}>
              {hasContent ? "Continue to review" : "Generate with AI"}
            </Button>
          ) : null}
        </div>
      </div>

      {proposal.status !== "draft" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Public link</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">
              {publicUrl}
            </code>
            <CopyLinkButton url={publicUrl} />
            <Button
              render={<a href={`/p/${proposal.public_token}`} target="_blank" rel="noreferrer" />}
              variant="outline"
              size="sm"
            >
              Open
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-muted-foreground">{proposal.brief_description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Investment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{formatCents(total, proposal.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due now ({proposal.payment_type})</span>
              <span className="font-medium">
                {formatCents(proposal.amount_due_cents, proposal.currency)}
              </span>
            </div>
            {payments && payments.length > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment status</span>
                <span className="font-medium capitalize">{payments[0].status}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {signatures && signatures.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Signature</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Signed by <span className="font-medium">{signatures[0].signer_name}</span> on{" "}
              {new Date(signatures[0].signed_at).toLocaleString("en-US")}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {events.map((event) => (
                <li key={event.id} className="flex justify-between text-muted-foreground">
                  <span className="capitalize">{event.event_type}</span>
                  <span>{new Date(event.occurred_at).toLocaleString("en-US")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
        </CardContent>
      </Card>

      <ProposalActions proposalId={proposal.id} status={displayStatus} />
    </div>
  );
}
