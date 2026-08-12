import Link from "next/link";
import { FilePlus2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { listProposals } from "@/lib/proposal/queries";
import { formatCents } from "@/lib/proposal/money";
import { effectiveStatus } from "@/lib/proposal/types";

export default async function DashboardPage() {
  const proposals = await listProposals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proposals</h1>
          <p className="text-sm text-muted-foreground">
            Create, track, and manage every proposal you send.
          </p>
        </div>
        <Button render={<Link href="/proposals/new" />}>
          <FilePlus2 className="h-4 w-4" />
          New Proposal
        </Button>
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No proposals yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first proposal to get started.
              </p>
            </div>
            <Button render={<Link href="/proposals/new" />} size="sm" className="mt-2">
              New Proposal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount due</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">&nbsp;</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-medium">
                    <Link href={`/proposals/${proposal.id}`} className="hover:underline">
                      {proposal.client_company}
                    </Link>
                    {proposal.headline ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {proposal.headline}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={effectiveStatus(proposal)} />
                  </TableCell>
                  <TableCell>
                    {formatCents(proposal.amount_due_cents, proposal.currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(proposal.created_at).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      render={<Link href={`/proposals/${proposal.id}`} />}
                      variant="ghost"
                      size="sm"
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
