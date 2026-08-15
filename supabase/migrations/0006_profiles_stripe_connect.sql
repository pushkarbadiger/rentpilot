-- Stripe Connect Express account metadata on landlord profiles (P2.8A).
-- Additive only: does not change profile RLS, id semantics, or existing data.
-- Does NOT store Stripe secret keys.

alter table public.profiles
  add column if not exists stripe_connect_account_id text;

alter table public.profiles
  add column if not exists stripe_connect_onboarding_status text not null default 'not_started';

alter table public.profiles
  add column if not exists stripe_connect_charges_enabled boolean not null default false;

alter table public.profiles
  add column if not exists stripe_connect_payouts_enabled boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_stripe_connect_onboarding_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_stripe_connect_onboarding_status_check
      check (stripe_connect_onboarding_status in ('not_started', 'pending', 'complete'));
  end if;
end $$;
