"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "./signature-pad";
import { formatCents } from "@/lib/proposal/money";

type PanelStatus = "unsigned" | "signed" | "paid";

export function ProposalActionsPanel({
  publicToken,
  initialStatus,
  initialSignerName,
  initialSignedAt,
  amountDueCents,
  currency,
}: {
  publicToken: string;
  initialStatus: PanelStatus;
  initialSignerName: string | null;
  initialSignedAt: string | null;
  amountDueCents: number;
  currency: string;
}) {
  const [status, setStatus] = useState<PanelStatus>(initialStatus);
  const [signerName, setSignerName] = useState(initialSignerName);
  const [signedAt, setSignedAt] = useState(initialSignedAt);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  async function handlePay() {
    setPayError(null);
    setIsRedirecting(true);
    try {
      const res = await fetch(`/p/${publicToken}/checkout`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) {
        throw new Error(body.error ?? "Failed to start checkout");
      }
      window.location.href = body.url;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Failed to start checkout");
      setIsRedirecting(false);
    }
  }

  if (status === "unsigned") {
    return (
      <SignaturePad
        publicToken={publicToken}
        onSigned={({ signerName: name, signedAt: at }) => {
          setSignerName(name);
          setSignedAt(at);
          setStatus("signed");
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-[#0a0a0c]">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span>
          Signed by <span className="font-semibold">{signerName}</span>
          {signedAt ? ` on ${new Date(signedAt).toLocaleDateString("en-US")}` : ""}
        </span>
      </div>

      {status === "paid" ? (
        <div className="flex items-center gap-2 text-sm text-[#0a0a0c]">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Payment received — thank you!</span>
        </div>
      ) : amountDueCents > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-[#525a66]">
            Amount due now: <span className="font-semibold">{formatCents(amountDueCents, currency)}</span>
          </p>
          <Button onClick={handlePay} disabled={isRedirecting}>
            {isRedirecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isRedirecting ? "Redirecting…" : "Pay now"}
          </Button>
          {payError ? <p className="text-sm text-red-600">{payError}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-[#525a66]">No payment required — you&rsquo;re all set.</p>
      )}
    </div>
  );
}
