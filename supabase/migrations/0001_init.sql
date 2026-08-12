-- Proposal Generation Platform — initial schema
-- Single-owner-per-organization MVP. Every table has RLS enabled.
-- The public proposal page never queries these tables from the browser;
-- it is always read/written server-side with the service-role key, which
-- bypasses RLS by design. See proposals/signatures/payments policies below.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Your Company',
  logo_url text,
  contact_email text,
  contact_phone text,
  contact_address text,
  scheduling_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- organizations policies (depend on profiles, defined after it)
create policy "organizations_select_own"
  on public.organizations for select
  using (id = (select org_id from public.profiles where id = auth.uid()));

create policy "organizations_update_own"
  on public.organizations for update
  using (id = (select org_id from public.profiles where id = auth.uid()));

-- ---------------------------------------------------------------------------
-- handle_new_user: create an org + profile row for every new auth.users row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_org_id uuid;
begin
  insert into public.organizations (name, contact_email)
  values (coalesce(new.raw_user_meta_data ->> 'company_name', 'Your Company'), new.email)
  returning id into new_org_id;

  insert into public.profiles (id, org_id, full_name, email)
  values (new.id, new_org_id, new.raw_user_meta_data ->> 'full_name', new.email);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- team_members (org-level defaults)
-- ---------------------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  role text,
  description text,
  photo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

create policy "team_members_all_own_org"
  on public.team_members for all
  using (org_id = (select org_id from public.profiles where id = auth.uid()))
  with check (org_id = (select org_id from public.profiles where id = auth.uid()));

-- ---------------------------------------------------------------------------
-- proposals
-- ---------------------------------------------------------------------------
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  public_token text not null unique,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'viewed', 'signed', 'paid', 'void', 'expired')),

  client_company text not null,
  client_contact_name text,
  client_email text,

  eyebrow_text text not null default 'PROJECT PROPOSAL',
  headline text,
  subhead text,

  proposal_date date not null default current_date,
  valid_for_days int not null default 30,

  currency text not null default 'USD',
  amount_due_cents bigint not null default 0,
  payment_type text not null default 'full' check (payment_type in ('full', 'deposit', 'custom')),

  brief_description text not null,

  sent_at timestamptz,
  first_viewed_at timestamptz,
  signed_at timestamptz,
  paid_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index proposals_org_id_idx on public.proposals (org_id);
create index proposals_public_token_idx on public.proposals (public_token);

create trigger proposals_set_updated_at
  before update on public.proposals
  for each row execute function public.set_updated_at();

alter table public.proposals enable row level security;

-- Owner-only. No anon/public policy — the public page reads via the
-- service-role client, which bypasses RLS entirely.
create policy "proposals_all_own_org"
  on public.proposals for all
  using (org_id = (select org_id from public.profiles where id = auth.uid()))
  with check (org_id = (select org_id from public.profiles where id = auth.uid()));

-- ---------------------------------------------------------------------------
-- proposal_content (one row per fixed template section)
-- ---------------------------------------------------------------------------
create table public.proposal_content (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  section_key text not null check (section_key in (
    'cover', 'executive_summary', 'challenges', 'solution',
    'why_us', 'scope', 'team', 'investment', 'agreement'
  )),
  sort_order int not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (proposal_id, section_key)
);

create trigger proposal_content_set_updated_at
  before update on public.proposal_content
  for each row execute function public.set_updated_at();

alter table public.proposal_content enable row level security;

create policy "proposal_content_all_own_org"
  on public.proposal_content for all
  using (exists (
    select 1 from public.proposals p
    where p.id = proposal_content.proposal_id
      and p.org_id = (select org_id from public.profiles where id = auth.uid())
  ))
  with check (exists (
    select 1 from public.proposals p
    where p.id = proposal_content.proposal_id
      and p.org_id = (select org_id from public.profiles where id = auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- pricing_line_items
-- ---------------------------------------------------------------------------
create table public.pricing_line_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  sort_order int not null default 0,
  item_name text not null,
  description text,
  amount_cents bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.pricing_line_items enable row level security;

create policy "pricing_line_items_all_own_org"
  on public.pricing_line_items for all
  using (exists (
    select 1 from public.proposals p
    where p.id = pricing_line_items.proposal_id
      and p.org_id = (select org_id from public.profiles where id = auth.uid())
  ))
  with check (exists (
    select 1 from public.proposals p
    where p.id = pricing_line_items.proposal_id
      and p.org_id = (select org_id from public.profiles where id = auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- proposal_team_members (snapshot copy, not FK to team_members)
-- ---------------------------------------------------------------------------
create table public.proposal_team_members (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  name text not null,
  role text,
  description text,
  photo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.proposal_team_members enable row level security;

create policy "proposal_team_members_all_own_org"
  on public.proposal_team_members for all
  using (exists (
    select 1 from public.proposals p
    where p.id = proposal_team_members.proposal_id
      and p.org_id = (select org_id from public.profiles where id = auth.uid())
  ))
  with check (exists (
    select 1 from public.proposals p
    where p.id = proposal_team_members.proposal_id
      and p.org_id = (select org_id from public.profiles where id = auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- signatures (audit trail — written only via service-role from the sign route)
-- ---------------------------------------------------------------------------
create table public.signatures (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  signer_name text not null,
  signer_email text,
  signature_type text not null check (signature_type in ('typed', 'drawn')),
  signature_data text not null,
  signed_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.signatures enable row level security;

-- Owner SELECT only — no INSERT/UPDATE policy for any client role.
create policy "signatures_select_own_org"
  on public.signatures for select
  using (exists (
    select 1 from public.proposals p
    where p.id = signatures.proposal_id
      and p.org_id = (select org_id from public.profiles where id = auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- payments (written only via service-role from checkout/webhook routes)
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  amount_cents bigint not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  paid_at timestamptz,
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

create policy "payments_select_own_org"
  on public.payments for select
  using (exists (
    select 1 from public.proposals p
    where p.id = payments.proposal_id
      and p.org_id = (select org_id from public.profiles where id = auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- proposal_events (full audit trail)
-- ---------------------------------------------------------------------------
create table public.proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  event_type text not null check (event_type in (
    'created', 'sent', 'viewed', 'signed', 'paid',
    'voided', 'resent', 'duplicated', 'expired'
  )),
  metadata jsonb,
  occurred_at timestamptz not null default now()
);

create index proposal_events_proposal_id_idx on public.proposal_events (proposal_id);

alter table public.proposal_events enable row level security;

create policy "proposal_events_select_own_org"
  on public.proposal_events for select
  using (exists (
    select 1 from public.proposals p
    where p.id = proposal_events.proposal_id
      and p.org_id = (select org_id from public.profiles where id = auth.uid())
  ));

-- Owner-authored events (void/resend/duplicate) are inserted via authenticated
-- Server Actions, so an authenticated INSERT policy is safe here; the
-- public-facing events (viewed/signed/paid) are inserted via service-role.
create policy "proposal_events_insert_own_org"
  on public.proposal_events for insert
  with check (exists (
    select 1 from public.proposals p
    where p.id = proposal_events.proposal_id
      and p.org_id = (select org_id from public.profiles where id = auth.uid())
  ));
