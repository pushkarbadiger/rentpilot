-- P2.8E: checkout-session reconciliation marker for idempotent rent_payment updates.
-- Set only after a successful rent_payments reconciliation from checkout.session.completed.

alter table public.stripe_checkout_sessions
  add column if not exists reconciled_at timestamptz;

create index if not exists stripe_checkout_sessions_reconciled_at_idx
  on public.stripe_checkout_sessions (reconciled_at)
  where reconciled_at is not null;
