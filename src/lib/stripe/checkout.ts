import "server-only";

import { getStripeClient } from "./client";

export interface CreateCheckoutSessionInput {
  proposalId: string;
  clientCompany: string;
  organizationName: string;
  amountDueCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  const stripe = getStripeClient();

  return stripe.checkout.sessions.create({
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: input.amountDueCents,
          product_data: {
            name: `${input.organizationName} — Proposal for ${input.clientCompany}`,
          },
        },
      },
    ],
    metadata: { proposal_id: input.proposalId },
  });
}
