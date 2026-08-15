-- Add explicit billing period identity for idempotent recurring rent generation.
-- billing_month is YYYY-MM and pairs with tenant + property to enforce:
--   ONE tenant + ONE property + ONE billing month = ONE rent record.
--
-- billing_month remains nullable for backward compatibility. New writes should
-- populate it (generated rent always sets it; manual create/update derive it
-- from due_date). PostgreSQL UNIQUE allows multiple NULL billing_month values,
-- so application writes should always set billing_month when possible.
--
-- ============================================================================
-- PREFLIGHT (run manually BEFORE applying this migration)
-- ============================================================================
-- If this returns any rows, resolve the conflicts manually before migrating.
-- Do NOT delete, merge, or auto-deduplicate payment history.
--
-- SELECT
--   owner_id,
--   tenant_id,
--   property_id,
--   to_char(due_date::date, 'YYYY-MM') AS billing_month,
--   COUNT(*) AS record_count
-- FROM public.rent_payments
-- GROUP BY owner_id, tenant_id, property_id, to_char(due_date::date, 'YYYY-MM')
-- HAVING COUNT(*) > 1;
-- ============================================================================

alter table public.rent_payments
  add column if not exists billing_month text
    check (billing_month is null or billing_month ~ '^\d{4}-(0[1-9]|1[0-2])$');

-- Backfill from due_date so existing manual records participate in duplicate prevention.
-- Only sets billing_month; no other payment fields are modified.
update public.rent_payments
  set billing_month = to_char(due_date::date, 'YYYY-MM')
  where billing_month is null;

-- Abort if duplicate tenant/property/billing-month groups exist.
-- This uses due_date month, which matches the backfill above for rows that were NULL.
do $$
declare
  duplicate_groups integer;
begin
  select count(*)::integer
    into duplicate_groups
  from (
    select
      owner_id,
      tenant_id,
      property_id,
      to_char(due_date::date, 'YYYY-MM') as billing_month
    from public.rent_payments
    group by owner_id, tenant_id, property_id, to_char(due_date::date, 'YYYY-MM')
    having count(*) > 1
  ) duplicates;

  if duplicate_groups > 0 then
    raise exception
      'Migration 0003 aborted: % duplicate rent_payments group(s) for (owner_id, tenant_id, property_id, billing month). Run the preflight query in this migration file and resolve conflicts manually before reapplying.',
      duplicate_groups;
  end if;
end $$;

-- Enforces idempotent generation at the database level (including concurrent requests).
-- Created only if it does not already exist (safe to re-run this migration).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rent_payments_owner_tenant_property_billing_month_key'
      and conrelid = 'public.rent_payments'::regclass
  ) then
    alter table public.rent_payments
      add constraint rent_payments_owner_tenant_property_billing_month_key
      unique (owner_id, tenant_id, property_id, billing_month);
  end if;
end $$;

create index if not exists rent_payments_billing_month_idx
  on public.rent_payments (billing_month);
