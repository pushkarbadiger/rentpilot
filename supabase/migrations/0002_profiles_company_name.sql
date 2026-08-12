-- Add company_name to profiles for existing deployments that were created
-- before this column was included in 0001_init.sql.
alter table public.profiles
  add column if not exists company_name text;
