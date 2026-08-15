-- Provider-neutral rent collection session audit trail (P2.8H).
-- Does not modify rent_payments or existing Stripe tables (0007–0009).
--
-- Idempotency: UNIQUE (owner_id, idempotency_key) prevents duplicate
-- session creation for the same request.

create table if not exists public.payment_collection_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  rent_payment_id uuid not null references public.rent_payments (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  provider text not null
    check (provider in ('razorpay', 'stripe', 'none')),
  provider_reference_id text,
  provider_payment_id text,
  amount_minor integer not null check (amount_minor > 0),
  currency text not null default 'inr'
    check (currency in ('inr', 'usd')),
  status text not null
    check (status in ('created', 'open', 'complete', 'expired', 'failed')),
  idempotency_key text not null,
  collection_url text,
  reconciled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb
);

create index if not exists payment_collection_sessions_owner_id_idx
  on public.payment_collection_sessions (owner_id);

create index if not exists payment_collection_sessions_rent_payment_id_idx
  on public.payment_collection_sessions (rent_payment_id);

create index if not exists payment_collection_sessions_status_idx
  on public.payment_collection_sessions (status);

create index if not exists payment_collection_sessions_provider_idx
  on public.payment_collection_sessions (provider);

create index if not exists payment_collection_sessions_reconciled_at_idx
  on public.payment_collection_sessions (reconciled_at)
  where reconciled_at is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payment_collection_sessions_owner_idempotency_key'
      and conrelid = 'public.payment_collection_sessions'::regclass
  ) then
    alter table public.payment_collection_sessions
      add constraint payment_collection_sessions_owner_idempotency_key
      unique (owner_id, idempotency_key);
  end if;
end $$;

create index if not exists payment_collection_sessions_provider_reference_id_idx
  on public.payment_collection_sessions (provider_reference_id)
  where provider_reference_id is not null;

alter table public.payment_collection_sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_collection_sessions'
      and policyname = 'Payment collection sessions are viewable by owner'
  ) then
    create policy "Payment collection sessions are viewable by owner"
      on public.payment_collection_sessions for select
      using (auth.uid() = owner_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_collection_sessions'
      and policyname = 'Payment collection sessions are insertable by owner'
  ) then
    create policy "Payment collection sessions are insertable by owner"
      on public.payment_collection_sessions for insert
      with check (auth.uid() = owner_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_collection_sessions'
      and policyname = 'Payment collection sessions are updatable by owner'
  ) then
    create policy "Payment collection sessions are updatable by owner"
      on public.payment_collection_sessions for update
      using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;
end $$;
