-- Stripe webhook event log for idempotency and audit (P2.8A).
-- RLS is enabled with no landlord-facing policies; normal authenticated
-- users cannot read or write webhook events. A privileged server-side
-- reconciliation path will be added in a later P2.8 phase.

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null,
  event_type text not null,
  stripe_account_id text,
  status text not null default 'pending'
    check (status in ('pending', 'processed', 'failed')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists stripe_webhook_events_status_idx
  on public.stripe_webhook_events (status);

create index if not exists stripe_webhook_events_stripe_account_id_idx
  on public.stripe_webhook_events (stripe_account_id);

create index if not exists stripe_webhook_events_event_type_idx
  on public.stripe_webhook_events (event_type);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stripe_webhook_events_stripe_event_id_key'
      and conrelid = 'public.stripe_webhook_events'::regclass
  ) then
    alter table public.stripe_webhook_events
      add constraint stripe_webhook_events_stripe_event_id_key
      unique (stripe_event_id);
  end if;
end $$;

create index if not exists stripe_webhook_events_stripe_event_id_idx
  on public.stripe_webhook_events (stripe_event_id);

alter table public.stripe_webhook_events enable row level security;
