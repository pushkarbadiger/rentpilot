-- Enforce that related landlord-owned records all belong to the same owner.
--
-- PREFLIGHT: run these read-only queries manually before applying this
-- migration. They report existing inconsistent rows; this migration never
-- deletes, repairs, or changes those rows automatically. Existing bad rows
-- remain until manually resolved; writes that change the checked relationship
-- fields will be rejected.
--
-- Tenants linked to another landlord's property:
-- SELECT t.id, t.owner_id, t.property_id, p.owner_id AS property_owner_id
-- FROM public.tenants t
-- JOIN public.properties p ON p.id = t.property_id
-- WHERE t.owner_id <> p.owner_id;
--
-- Rent payments linked to another landlord's tenant or property:
-- SELECT rp.id, rp.owner_id, rp.tenant_id, t.owner_id AS tenant_owner_id,
--        rp.property_id, p.owner_id AS property_owner_id
-- FROM public.rent_payments rp
-- JOIN public.tenants t ON t.id = rp.tenant_id
-- JOIN public.properties p ON p.id = rp.property_id
-- WHERE rp.owner_id <> t.owner_id
--    OR rp.owner_id <> p.owner_id
--    OR (t.property_id IS NOT NULL AND rp.property_id <> t.property_id);
--
-- Reminder logs linked to another landlord's payment or tenant:
-- SELECT r.id, r.owner_id, rp.owner_id AS payment_owner_id,
--        t.owner_id AS tenant_owner_id
-- FROM public.rent_reminder_logs r
-- JOIN public.rent_payments rp ON rp.id = r.rent_payment_id
-- JOIN public.tenants t ON t.id = r.tenant_id
-- WHERE r.owner_id <> rp.owner_id
--    OR r.owner_id <> t.owner_id
--    OR r.tenant_id <> rp.tenant_id;
--
-- Stripe checkout sessions linked to another landlord's payment or tenant:
-- SELECT s.id, s.owner_id, rp.owner_id AS payment_owner_id,
--        t.owner_id AS tenant_owner_id
-- FROM public.stripe_checkout_sessions s
-- JOIN public.rent_payments rp ON rp.id = s.rent_payment_id
-- JOIN public.tenants t ON t.id = s.tenant_id
-- WHERE s.owner_id <> rp.owner_id
--    OR s.owner_id <> t.owner_id
--    OR s.tenant_id <> rp.tenant_id;
--
-- Payment collection sessions linked to another landlord's payment or tenant:
-- SELECT s.id, s.owner_id, rp.owner_id AS payment_owner_id,
--        t.owner_id AS tenant_owner_id
-- FROM public.payment_collection_sessions s
-- JOIN public.rent_payments rp ON rp.id = s.rent_payment_id
-- JOIN public.tenants t ON t.id = s.tenant_id
-- WHERE s.owner_id <> rp.owner_id
--    OR s.owner_id <> t.owner_id
--    OR s.tenant_id <> rp.tenant_id;

create or replace function public.assert_tenant_property_owner_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  related_owner_id uuid;
begin
  if new.property_id is null then
    return new;
  end if;

  select owner_id into related_owner_id
  from public.properties
  where id = new.property_id;

  if related_owner_id is null or related_owner_id <> new.owner_id then
    raise exception 'tenant property must belong to the same owner'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.assert_rent_payment_owner_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  tenant_owner_id uuid;
  property_owner_id uuid;
  tenant_property_id uuid;
begin
  select owner_id, property_id into tenant_owner_id, tenant_property_id
  from public.tenants
  where id = new.tenant_id;

  select owner_id into property_owner_id
  from public.properties
  where id = new.property_id;

  if tenant_owner_id is null or property_owner_id is null
     or tenant_owner_id <> new.owner_id
     or property_owner_id <> new.owner_id
     or (tenant_property_id is not null
         and tenant_property_id <> new.property_id) then
    raise exception 'rent payment tenant and property must belong to the same owner'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.assert_reminder_log_owner_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  payment_owner_id uuid;
  tenant_owner_id uuid;
  payment_tenant_id uuid;
begin
  select owner_id, tenant_id into payment_owner_id, payment_tenant_id
  from public.rent_payments
  where id = new.rent_payment_id;

  select owner_id into tenant_owner_id
  from public.tenants
  where id = new.tenant_id;

  if payment_owner_id is null or tenant_owner_id is null
     or payment_owner_id <> new.owner_id
     or tenant_owner_id <> new.owner_id
     or payment_tenant_id <> new.tenant_id then
    raise exception 'reminder log payment and tenant must belong to the same owner'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.assert_checkout_session_owner_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  payment_owner_id uuid;
  tenant_owner_id uuid;
  payment_tenant_id uuid;
begin
  select owner_id, tenant_id into payment_owner_id, payment_tenant_id
  from public.rent_payments
  where id = new.rent_payment_id;

  select owner_id into tenant_owner_id
  from public.tenants
  where id = new.tenant_id;

  if payment_owner_id is null or tenant_owner_id is null
     or payment_owner_id <> new.owner_id
     or tenant_owner_id <> new.owner_id
     or payment_tenant_id <> new.tenant_id then
    raise exception 'checkout session payment and tenant must belong to the same owner'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.assert_payment_collection_session_owner_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  payment_owner_id uuid;
  tenant_owner_id uuid;
  payment_tenant_id uuid;
begin
  select owner_id, tenant_id into payment_owner_id, payment_tenant_id
  from public.rent_payments
  where id = new.rent_payment_id;

  select owner_id into tenant_owner_id
  from public.tenants
  where id = new.tenant_id;

  if payment_owner_id is null or tenant_owner_id is null
     or payment_owner_id <> new.owner_id
     or tenant_owner_id <> new.owner_id
     or payment_tenant_id <> new.tenant_id then
    raise exception 'payment collection session payment and tenant must belong to the same owner'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_tenant_property_owner_consistency on public.tenants;
create trigger enforce_tenant_property_owner_consistency
  before insert or update of owner_id, property_id on public.tenants
  for each row execute function public.assert_tenant_property_owner_consistency();

drop trigger if exists enforce_rent_payment_owner_consistency on public.rent_payments;
create trigger enforce_rent_payment_owner_consistency
  before insert or update of owner_id, tenant_id, property_id on public.rent_payments
  for each row execute function public.assert_rent_payment_owner_consistency();

drop trigger if exists enforce_reminder_log_owner_consistency on public.rent_reminder_logs;
create trigger enforce_reminder_log_owner_consistency
  before insert or update of owner_id, rent_payment_id, tenant_id on public.rent_reminder_logs
  for each row execute function public.assert_reminder_log_owner_consistency();

drop trigger if exists enforce_checkout_session_owner_consistency on public.stripe_checkout_sessions;
create trigger enforce_checkout_session_owner_consistency
  before insert or update of owner_id, rent_payment_id, tenant_id on public.stripe_checkout_sessions
  for each row execute function public.assert_checkout_session_owner_consistency();

drop trigger if exists enforce_payment_collection_session_owner_consistency on public.payment_collection_sessions;
create trigger enforce_payment_collection_session_owner_consistency
  before insert or update of owner_id, rent_payment_id, tenant_id on public.payment_collection_sessions
  for each row execute function public.assert_payment_collection_session_owner_consistency();
