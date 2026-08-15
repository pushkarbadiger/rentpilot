-- Rent reminder send log for idempotent manual email reminders.
-- Does not modify rent_payments or any existing payment data.
--
-- Idempotency: UNIQUE (owner_id, rent_payment_id, reminder_kind) reserves one
-- log row per payment per reminder type. Use status lifecycle:
--   pending -> sent | failed
-- Successful sends (sent/simulated) block duplicate reminders of the same kind.

create table if not exists public.rent_reminder_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  rent_payment_id uuid not null references public.rent_payments (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  reminder_kind text not null
    check (reminder_kind in ('upcoming', 'due', 'late')),
  channel text not null default 'email'
    check (channel = 'email'),
  recipient_email text not null,
  subject text not null,
  provider text not null,
  provider_message_id text,
  status text not null
    check (status in ('pending', 'sent', 'failed', 'simulated')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists rent_reminder_logs_owner_id_idx
  on public.rent_reminder_logs (owner_id);

create index if not exists rent_reminder_logs_rent_payment_id_idx
  on public.rent_reminder_logs (rent_payment_id);

create index if not exists rent_reminder_logs_status_idx
  on public.rent_reminder_logs (status);

-- One reservation per owner + payment + reminder kind (race-safe send slot).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rent_reminder_logs_owner_payment_kind_key'
      and conrelid = 'public.rent_reminder_logs'::regclass
  ) then
    alter table public.rent_reminder_logs
      add constraint rent_reminder_logs_owner_payment_kind_key
      unique (owner_id, rent_payment_id, reminder_kind);
  end if;
end $$;

alter table public.rent_reminder_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rent_reminder_logs'
      and policyname = 'Rent reminder logs are viewable by owner'
  ) then
    create policy "Rent reminder logs are viewable by owner"
      on public.rent_reminder_logs for select
      using (auth.uid() = owner_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rent_reminder_logs'
      and policyname = 'Rent reminder logs are insertable by owner'
  ) then
    create policy "Rent reminder logs are insertable by owner"
      on public.rent_reminder_logs for insert
      with check (auth.uid() = owner_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rent_reminder_logs'
      and policyname = 'Rent reminder logs are updatable by owner'
  ) then
    create policy "Rent reminder logs are updatable by owner"
      on public.rent_reminder_logs for update
      using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;
end $$;
