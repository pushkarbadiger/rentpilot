-- Tracks when a reminder reservation (pending) was last claimed.
-- Used to recover stale pending rows after interrupted sends without
-- weakening the unique constraint or deleting log records.

alter table public.rent_reminder_logs
  add column if not exists reserved_at timestamptz;

update public.rent_reminder_logs
set reserved_at = created_at
where reserved_at is null
  and status in ('pending', 'failed', 'sent', 'simulated');

create index if not exists rent_reminder_logs_reserved_at_idx
  on public.rent_reminder_logs (reserved_at)
  where status = 'pending';
