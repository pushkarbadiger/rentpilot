-- Stripe Checkout session audit trail for rent collection (P2.8A).
-- Does not modify rent_payments or existing payment semantics.
--
-- Idempotency: UNIQUE (owner_id, idempotency_key) prevents duplicate
-- session creation for the same request. New checkout attempts for the
-- same rent payment use a new idempotency_key (e.g. after expiry).

create table if not exists public.stripe_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  rent_payment_id uuid not null references public.rent_payments (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  stripe_checkout_session_id text not null,
  stripe_payment_intent_id text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd' check (currency = 'usd'),
  status text not null
    check (status in ('created', 'open', 'complete', 'expired', 'failed')),
  idempotency_key text not null,
  checkout_url text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists stripe_checkout_sessions_owner_id_idx
  on public.stripe_checkout_sessions (owner_id);

create index if not exists stripe_checkout_sessions_rent_payment_id_idx
  on public.stripe_checkout_sessions (rent_payment_id);

create index if not exists stripe_checkout_sessions_status_idx
  on public.stripe_checkout_sessions (status);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stripe_checkout_sessions_stripe_checkout_session_id_key'
      and conrelid = 'public.stripe_checkout_sessions'::regclass
  ) then
    alter table public.stripe_checkout_sessions
      add constraint stripe_checkout_sessions_stripe_checkout_session_id_key
      unique (stripe_checkout_session_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stripe_checkout_sessions_owner_idempotency_key'
      and conrelid = 'public.stripe_checkout_sessions'::regclass
  ) then
    alter table public.stripe_checkout_sessions
      add constraint stripe_checkout_sessions_owner_idempotency_key
      unique (owner_id, idempotency_key);
  end if;
end $$;

create index if not exists stripe_checkout_sessions_stripe_checkout_session_id_idx
  on public.stripe_checkout_sessions (stripe_checkout_session_id);

alter table public.stripe_checkout_sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'stripe_checkout_sessions'
      and policyname = 'Stripe checkout sessions are viewable by owner'
  ) then
    create policy "Stripe checkout sessions are viewable by owner"
      on public.stripe_checkout_sessions for select
      using (auth.uid() = owner_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'stripe_checkout_sessions'
      and policyname = 'Stripe checkout sessions are insertable by owner'
  ) then
    create policy "Stripe checkout sessions are insertable by owner"
      on public.stripe_checkout_sessions for insert
      with check (auth.uid() = owner_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'stripe_checkout_sessions'
      and policyname = 'Stripe checkout sessions are updatable by owner'
  ) then
    create policy "Stripe checkout sessions are updatable by owner"
      on public.stripe_checkout_sessions for update
      using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;
end $$;
