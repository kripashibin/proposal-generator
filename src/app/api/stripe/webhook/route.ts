import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutCompleted(session, event);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, event: Stripe.Event) {
  const supabase = createAdminClient();
  const proposalId = session.metadata?.proposal_id;
  if (!proposalId) {
    console.error("Stripe session missing proposal_id metadata", session.id);
    return;
  }

  const now = new Date().toISOString();
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  const { error: paymentError } = await supabase
    .from("payments")
    .update({
      status: "paid",
      paid_at: now,
      stripe_payment_intent_id: paymentIntentId,
      raw_event: event as unknown as Record<string, unknown>,
    })
    .eq("stripe_checkout_session_id", session.id);

  if (paymentError) {
    console.error("Failed to update payment record", paymentError);
    return;
  }

  const { error: proposalError } = await supabase
    .from("proposals")
    .update({ status: "paid", paid_at: now })
    .eq("id", proposalId);

  if (proposalError) {
    console.error("Failed to update proposal status to paid", proposalError);
    return;
  }

  await supabase.from("proposal_events").insert({ proposal_id: proposalId, event_type: "paid" });
}
