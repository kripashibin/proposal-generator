import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckoutSession } from "@/lib/stripe/checkout";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("id, status, client_company, currency, amount_due_cents, org_id")
    .eq("public_token", token)
    .maybeSingle();

  if (error || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.status !== "signed") {
    return NextResponse.json(
      { error: "The proposal must be signed before payment" },
      { status: 409 },
    );
  }

  if (proposal.amount_due_cents <= 0) {
    return NextResponse.json({ error: "No payment is required for this proposal" }, { status: 400 });
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", proposal.org_id)
    .single();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin;

  try {
    const session = await createCheckoutSession({
      proposalId: proposal.id,
      clientCompany: proposal.client_company,
      organizationName: organization?.name ?? "Your Company",
      amountDueCents: proposal.amount_due_cents,
      currency: proposal.currency,
      successUrl: `${baseUrl}/p/${token}?payment=success`,
      cancelUrl: `${baseUrl}/p/${token}?payment=cancelled`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      proposal_id: proposal.id,
      stripe_checkout_session_id: session.id,
      amount_cents: proposal.amount_due_cents,
      currency: proposal.currency,
      status: "pending",
    });

    if (paymentError) throw paymentError;

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Failed to create checkout session", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start checkout" },
      { status: 500 },
    );
  }
}
