-- Provider-neutral payment webhook event log for idempotency and audit (P2.8H).
-- RLS is enabled with no landlord-facing policies; service-role webhook path only.

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null
    check (provider in ('razorpay', 'stripe', 'none')),
  provider_event_id text not null,
  event_type text,
  status text not null default 'pending'
    check (status in ('pending', 'processed', 'failed')),
  error_message text,
  provider_account_id text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists payment_webhook_events_status_idx
  on public.payment_webhook_events (status);

create index if not exists payment_webhook_events_provider_idx
  on public.payment_webhook_events (provider);

create index if not exists payment_webhook_events_event_type_idx
  on public.payment_webhook_events (event_type);

create index if not exists payment_webhook_events_provider_account_id_idx
  on public.payment_webhook_events (provider_account_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payment_webhook_events_provider_event_id_key'
      and conrelid = 'public.payment_webhook_events'::regclass
  ) then
    alter table public.payment_webhook_events
      add constraint payment_webhook_events_provider_event_id_key
      unique (provider, provider_event_id);
  end if;
end $$;

create index if not exists payment_webhook_events_provider_event_id_idx
  on public.payment_webhook_events (provider, provider_event_id);

alter table public.payment_webhook_events enable row level security;
