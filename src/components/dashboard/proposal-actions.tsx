"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Send, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  deleteDraftProposal,
  duplicateProposal,
  markProposalResent,
  voidProposal,
} from "@/lib/proposal/actions";
import type { ProposalStatus } from "@/lib/supabase/database.types";

export function ProposalActions({
  proposalId,
  status,
}: {
  proposalId: string;
  status: ProposalStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDuplicate() {
    startTransition(async () => {
      try {
        const { id } = await duplicateProposal(proposalId);
        toast.success("Duplicated as a new draft");
        router.push(`/proposals/${id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to duplicate");
      }
    });
  }

  function handleVoid() {
    if (!confirm("Void this proposal? The public link will stop working.")) return;
    startTransition(async () => {
      try {
        await voidProposal(proposalId);
        toast.success("Proposal voided");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to void");
      }
    });
  }

  function handleResend() {
    startTransition(async () => {
      try {
        await markProposalResent(proposalId);
        toast.success("Marked as resent");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await deleteDraftProposal(proposalId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Manage</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
          Duplicate
        </Button>
        {["sent", "viewed", "expired"].includes(status) ? (
          <Button variant="outline" size="sm" onClick={handleResend} disabled={isPending}>
            <Send className="h-4 w-4" />
            Mark as resent
          </Button>
        ) : null}
        {status === "draft" ? (
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="h-4 w-4" />
            Delete draft
          </Button>
        ) : status !== "void" ? (
          <Button variant="outline" size="sm" onClick={handleVoid} disabled={isPending}>
            <XCircle className="h-4 w-4" />
            Void
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
