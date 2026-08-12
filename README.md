# Proposal Studio

A proposal generation platform: create a client proposal, have AI draft the
narrative content into a fixed 9-section template, publish it to a public
unique URL, and let the client view, sign, and pay from that page.

**Stack:** Next.js (App Router) · Supabase (Postgres, Auth, Storage) ·
Google Gemini (AI content generation) · Stripe (payments) · Tailwind + shadcn/ui

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account (free tier is fine)
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (free tier)
- A [Stripe](https://dashboard.stripe.com/register) account (test mode is fine)

## 1. Clone and install

```bash
git clone https://github.com/kripashibin/proposal-generator.git
cd proposal-generator
npm install
```

## 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard).
2. In the Supabase dashboard, go to **SQL Editor -> New query**, paste the
   contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
   and run it. Repeat for
   [`supabase/migrations/0002_storage.sql`](supabase/migrations/0002_storage.sql).
   (These create every table, RLS policy, and the org-logo storage bucket.)
3. In **Settings -> API**, copy the **Project URL**, **anon public key**, and
   **service_role key** — you'll need all three in step 5.
4. In **Authentication -> Providers -> Email**, note that "Confirm email" is
   on by default: real sign-ups need working email delivery (Supabase's
   built-in email works out of the box for low volume), or you can turn
   confirmation off there for faster local testing.

## 3. Get a Gemini API key

Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey), sign
in, and click **Create API key**. This is what powers AI proposal-content
generation (`GEMINI_API_KEY`).

## 4. Get Stripe test keys

1. In the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys)
   (test mode), copy your **Secret key** (`sk_test_...`).
2. The webhook signing secret (`STRIPE_WEBHOOK_SECRET`) is generated when you
   run the Stripe CLI locally — see step 6.

## 5. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in every value in `.env.local`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (keep secret — server-only) |
| `GEMINI_API_KEY` | aistudio.google.com/apikey |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys (test mode) |
| `STRIPE_WEBHOOK_SECRET` | printed by `stripe listen` locally (step 6), or your production webhook endpoint's secret |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` for local dev |

`.env.local` is gitignored — never commit it.

## 6. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Create
account**, and you're in. Signing up automatically creates your
organization — no separate setup step.

### Testing Stripe payments locally

Stripe can't reach `localhost` directly, so forward webhook events with the
[Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This prints a webhook signing secret (`whsec_...`) — put it in
`STRIPE_WEBHOOK_SECRET` in `.env.local` and restart `npm run dev`. Keep
`stripe listen` running alongside the dev server whenever you're testing the
sign → pay flow. Use Stripe's test card `4242 4242 4242 4242` (any future
expiry, any CVC) at checkout.

## Deploying to production

- Point `NEXT_PUBLIC_BASE_URL` at your deployed domain.
- In the Stripe dashboard, create a **live webhook endpoint** pointing at
  `https://<your-domain>/api/stripe/webhook`, subscribed to
  `checkout.session.completed`, and use *that* endpoint's signing secret for
  `STRIPE_WEBHOOK_SECRET` instead of the one from `stripe listen`.
- Swap `STRIPE_SECRET_KEY` for a live-mode key when you're ready to accept
  real payments.
