-- RentPilot Phase 1 schema
-- Run this in the Supabase SQL editor, or via the Supabase CLI:
--   supabase db push
--
-- Tables: profiles, properties, tenants, rent_payments
-- All tables use UUID primary keys, created_at/updated_at timestamps,
-- foreign keys back to auth.users (via profiles), and Row Level Security
-- so each landlord can only ever see their own data.

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Helper: keep updated_at current on every row update
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles: one row per authenticated user (landlord / property manager)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  company_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Automatically create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  property_type text not null default 'apartment'
    check (property_type in ('apartment', 'house', 'condo', 'duplex', 'commercial', 'other')),
  units integer not null default 1 check (units >= 1),
  monthly_rent numeric(12, 2) not null default 0 check (monthly_rent >= 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_owner_id_idx on public.properties (owner_id);
create index if not exists properties_status_idx on public.properties (status);

create trigger set_properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- tenants
-- ---------------------------------------------------------------------
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  unit text,
  lease_start date,
  lease_end date,
  monthly_rent numeric(12, 2) not null default 0 check (monthly_rent >= 0),
  security_deposit numeric(12, 2) not null default 0 check (security_deposit >= 0),
  status text not null default 'active' check (status in ('active', 'pending', 'former')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_owner_id_idx on public.tenants (owner_id);
create index if not exists tenants_property_id_idx on public.tenants (property_id);
create index if not exists tenants_status_idx on public.tenants (status);

create trigger set_tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- rent_payments
-- ---------------------------------------------------------------------
create table if not exists public.rent_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  due_date date not null,
  payment_date date,
  status text not null default 'pending' check (status in ('paid', 'pending', 'late', 'partial')),
  payment_method text check (payment_method in ('bank_transfer', 'card', 'cash', 'check', 'other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rent_payments_owner_id_idx on public.rent_payments (owner_id);
create index if not exists rent_payments_tenant_id_idx on public.rent_payments (tenant_id);
create index if not exists rent_payments_property_id_idx on public.rent_payments (property_id);
create index if not exists rent_payments_due_date_idx on public.rent_payments (due_date);
create index if not exists rent_payments_status_idx on public.rent_payments (status);

create trigger set_rent_payments_updated_at
  before update on public.rent_payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- Every table is scoped to owner_id (or, for profiles, id) matching the
-- authenticated user, so landlords can only ever read or write their own
-- data. No table is readable by anonymous/public roles.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.tenants enable row level security;
alter table public.rent_payments enable row level security;

-- profiles
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are editable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

-- properties
create policy "Properties are viewable by owner"
  on public.properties for select
  using (auth.uid() = owner_id);

create policy "Properties are insertable by owner"
  on public.properties for insert
  with check (auth.uid() = owner_id);

create policy "Properties are updatable by owner"
  on public.properties for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Properties are deletable by owner"
  on public.properties for delete
  using (auth.uid() = owner_id);

-- tenants
create policy "Tenants are viewable by owner"
  on public.tenants for select
  using (auth.uid() = owner_id);

create policy "Tenants are insertable by owner"
  on public.tenants for insert
  with check (auth.uid() = owner_id);

create policy "Tenants are updatable by owner"
  on public.tenants for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Tenants are deletable by owner"
  on public.tenants for delete
  using (auth.uid() = owner_id);

-- rent_payments
create policy "Rent payments are viewable by owner"
  on public.rent_payments for select
  using (auth.uid() = owner_id);

create policy "Rent payments are insertable by owner"
  on public.rent_payments for insert
  with check (auth.uid() = owner_id);

create policy "Rent payments are updatable by owner"
  on public.rent_payments for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Rent payments are deletable by owner"
  on public.rent_payments for delete
  using (auth.uid() = owner_id);
