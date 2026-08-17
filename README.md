# RentPilot

**Your rental portfolio, on autopilot.**

RentPilot is an AI-ready rental property management platform for landlords
and property managers. Built on Next.js and Supabase, it provides a
complete SaaS foundation — landing page, authentication, dashboard,
property management, tenant management, and rent tracking — with clean
service boundaries ready for AI automation, payments, and multi-user
organizations in later phases.

Phase 2 adds a polished visual design system (CSS animations, consistent
indigo palette, design tokens), a redesigned dashboard with portfolio
health indicators and attention center, an enriched landing page with
problem/solution, workflow, and CTA sections, improved auth flows (email
confirmation, safe redirect URLs), proper 401 status codes on API routes,
and a database migration for cross-table owner consistency enforcement.

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript** throughout
- **Tailwind CSS v4**
- **Supabase** (Postgres, Auth, Row Level Security)
- **Zod** for validation
- **lucide-react** for icons

## Getting started

```bash
cd rentpilot
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo mode (no setup required)

RentPilot runs out of the box **without any Supabase credentials**. If
`.env.local` is missing or incomplete, every page automatically falls back
to a realistic in-memory demo dataset (5 properties, 6 tenants, 8 rent
payments) so you can explore the entire product — landing page, dashboard,
properties, tenants, rent tracking — immediately.

You'll see a small "Demo mode" banner in the dashboard and on the user
menu. In demo mode, create/edit/delete actions run through full
validation and show real success/error states, but changes are **not
persisted** (there's no database to write to yet). Connect Supabase to
make changes stick.

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

3. Configure these environment variable names in `.env.local` (values come
   from Supabase Project Settings -> API and must not be committed):

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_APP_URL
   ```

   `NEXT_PUBLIC_APP_URL` is the trusted application origin used in Supabase
   confirmation emails (for example, your local development origin or deployed
   HTTPS origin). `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is also supported as a
   compatibility alternative to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. Run the schema migration. Easiest path: open the Supabase SQL editor
   and paste the contents of `supabase/migrations/0001_init.sql`, then
   run it. (Or, if you use the Supabase CLI: `supabase db push`.)

   **Existing projects:** if profile save fails after connecting Supabase,
   also run `supabase/migrations/0002_profiles_company_name.sql` in the
   SQL editor. Older databases may be missing the `profiles.company_name`
   column even when the app expects it.

   For recurring rent generation, also run
   `supabase/migrations/0003_rent_payments_billing_month.sql`.

   For manual email rent reminders, also run
   `supabase/migrations/0004_rent_reminder_logs.sql` and
   `supabase/migrations/0005_rent_reminder_logs_reserved_at.sql`.

   For Stripe payment collection schema preparation (P2.8A — does not
   enable payments yet), also run, in order:
   `supabase/migrations/0006_profiles_stripe_connect.sql`,
   `supabase/migrations/0007_stripe_checkout_sessions.sql`, and
   `supabase/migrations/0008_stripe_webhook_events.sql`.

   For cross-table owner consistency enforcement, run
   `supabase/migrations/0012_owner_consistency.sql` (see "Owner consistency
   enforcement" section below).

   This creates `profiles`, `properties`, `tenants`, and `rent_payments`,
   with UUID primary keys, foreign keys, indexes, `created_at` /
   `updated_at` timestamps, and **Row Level Security** policies scoping
   every table to `auth.uid()` — each landlord can only ever see their
   own data. A trigger automatically creates a `profiles` row whenever
   someone signs up.

5. In Supabase Auth settings, make sure **Email** sign-in is enabled
   (it is by default). Set the Auth **Site URL** to `NEXT_PUBLIC_APP_URL`, and
   add this redirect URL to the allowed redirect list:

   ```
   NEXT_PUBLIC_APP_URL/auth/callback
   ```

   If **Confirm email** is disabled, signup creates a session and immediately
   opens the dashboard. If it is enabled, RentPilot shows a confirmation notice;
   the verification email returns through `/auth/callback`, creates the session,
   and then opens the dashboard.

6. Restart `npm run dev`. The demo banner disappears and `/signup` /
   `/login` create and authenticate real users backed by Supabase.

If the public Supabase variables are absent, RentPilot deliberately remains in
demo mode: Demo Landlord and the bundled properties, tenants, and payments are
available, but all mutations are simulated and never written to Supabase.

No service-role key is required for core functionality, and none is ever sent
to the browser — everything runs through the anon key plus Row Level
Security.

## Project structure

```
src/
  app/
    page.tsx                  # Landing page (multi-section marketing site)
    (auth)/login, /signup     # Auth pages (route group, shared layout)
    auth/actions.ts           # Server actions: sign up / login / logout
    auth/callback/route.ts    # Supabase auth callback (email/OAuth)
    dashboard/                # Protected app (layout checks auth)
      page.tsx                # Overview: KPIs, portfolio health, attention center
      properties/             # List, new, [id], [id]/edit
      tenants/                # List, new, [id], [id]/edit
      rent/                   # List/overview, new, [id]/edit
      ai/                     # AI chat assistant
    api/                      # REST-style API routes (same services layer)
  components/
    ui/                       # Button, Card, Field, Badge, EmptyState, ConfirmDialog, ...
    layout/                   # Sidebar, Header, MobileNav, UserMenu
    landing/                  # Hero, Features, ProductPreview, ProblemSolution, WorkflowSection, FinalCTA, Footer
    forms/                    # PropertyForm, TenantForm, RentPaymentForm
    dashboard/                # AttentionCenter, QuickActions, RecentActivity, UpcomingRent, PropertyOverview
  lib/
    supabase/                 # Browser client, server client, middleware
    services/                 # properties, tenants, rent-payments, dashboard
    services/ai/              # Provider-agnostic AI interfaces (Phase 2+)
    types/                    # Domain types + hand-authored Database type
    demo-data.ts              # Realistic fallback dataset
    validation.ts             # Zod schemas shared by forms + API routes
supabase/
  migrations/0001_init.sql    # Full schema + RLS policies
  migrations/0012_owner_consistency.sql  # Cross-table owner consistency triggers
```

Every data operation — in Server Components, Server Actions, and API
routes alike — goes through the functions in `src/lib/services/`. Those
functions check `isSupabaseConfigured` and transparently serve demo data
or real Supabase data, so UI code never needs to know which mode it's in.

## Architecture notes for what's next

- **AI automation**: `src/lib/services/ai/` defines typed interfaces for
  rent reminders, maintenance classification, tenant message drafts,
  cash-flow forecasting, and property insights, plus a single
  `getAIProvider()` entry point. Nothing calls a model yet — wire up a
  real provider there without touching any page or component.
- **Payments & notifications**: the `rent_payments` table and service
  layer are the natural integration point for a payments provider
  (Stripe, etc.) and for reminder/notification jobs.
- **Multi-user organizations**: `profiles` is already a separate table
  from `auth.users`, and every other table references `owner_id`, so
  introducing an `organizations` table and switching ownership from a
  single user to an org is an additive schema change, not a rewrite.

## Email rent reminders (P2.7)

Manual email reminders are available on the rent dashboard (batch) and each
rent payment detail page (single). Configure `RESEND_API_KEY` and
`EMAIL_FROM` in `.env.local` (server-only — never `NEXT_PUBLIC_*`).

**Eligibility** (local calendar dates, open/unpaid payments only):

| Kind | When eligible |
|------|----------------|
| `upcoming` | Due date is within the next 3 days (not today or past) |
| `due` | Due date is today and payment is not yet late |
| `late` | Effective status is late (overdue and unpaid) |

Each payment can receive at most one successful reminder per kind per
owner (`rent_reminder_logs` unique constraint). Demo mode simulates sends
in memory without contacting Resend.

**Idempotency**: a `pending` log row is reserved before calling Resend
(with an `Idempotency-Key` header). The row is updated to `sent` or
`failed` afterward; duplicate successful sends are blocked by the DB
constraint and pre-send checks. If a send is interrupted while
`pending`, reservations older than 5 minutes are automatically recovered
to `failed` (using `reserved_at`) so the landlord can retry safely.

For manual email rent reminders, also run
`supabase/migrations/0005_rent_reminder_logs_reserved_at.sql` after 0004.

## Stripe payment collection (P2.8A–P2.8E)

Migrations `0006`–`0009` support Stripe Connect Express, Checkout Sessions,
webhook idempotency, and payment reconciliation.

Apply in order after `0005`:

1. `0006_profiles_stripe_connect.sql` — Connect fields on `profiles`
2. `0007_stripe_checkout_sessions.sql` — checkout session audit table
3. `0008_stripe_webhook_events.sql` — webhook idempotency/audit table
4. `0009_stripe_checkout_sessions_reconciled_at.sql` — reconciliation marker

### Environment (server-only)

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...   # webhook processing only
```

Never use `NEXT_PUBLIC_*` for these values.

### Collect rent (P2.8C)

Landlords with a connected Stripe account can create a Checkout Session for
an open rent payment from `/dashboard/rent/[id]`. The outstanding balance is
calculated server-side; the client sends only `rent_payment_id`.

### Webhook endpoint (P2.8D–P2.8E)

`POST /api/webhooks/stripe` — public to Stripe, no Supabase user session.

Flow:

1. Verify `Stripe-Signature` against raw body (`STRIPE_WEBHOOK_SECRET`)
2. Insert/dedupe `stripe_webhook_events` by `stripe_event_id`
3. For `checkout.session.completed`: correlate checkout session, validate
   amounts/ownership, reconcile into `rent_payments`
4. Mark webhook event `processed` (or `failed` for permanent errors)

Returning from Checkout success URL does **not** confirm payment — only the
webhook reconciles.

### Reconciliation semantics (P2.8E)

Authoritative event: `checkout.session.completed` only (not
`payment_intent.succeeded`).

Amount validation:

- Stripe `amount_total` must equal `stripe_checkout_sessions.amount_cents`
- Currency must be `usd`
- Received amount must not exceed current outstanding balance
  (`getPaymentOutstandingAmount`)
- Overpayment or amount mismatch → `rent_payments` unchanged, webhook
  event marked `failed`

Full payment (received ≥ outstanding):

| Stored status | Result |
|---------------|--------|
| `pending` / `late` | `paid`, invoice `amount` unchanged, `payment_method: card` |
| `partial` | `paid`, `amount` = collected total |

Partial payment (received < outstanding):

| Stored status | Result |
|---------------|--------|
| `pending` / `late` | `partial`, `amount` = received |
| `partial` | `partial`, `amount` = prior collected + received |

Idempotency:

- `stripe_webhook_events.stripe_event_id` — duplicate processed events → HTTP 200, no reprocessing
- `stripe_checkout_sessions.reconciled_at` — duplicate checkout completion → no double-count
- Optimistic lock on `rent_payments` (`status` + `amount` unchanged since read)

### Test-mode verification

1. Complete Stripe Connect onboarding in Settings
2. Create a Checkout Session for an open rent payment
3. Pay in Stripe test mode
4. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
5. Confirm `rent_payments` updated and `stripe_checkout_sessions.reconciled_at` set
6. Replay the same event ID — payment must not change twice

### Payment observability (P2.8F)

The rent payment detail page (`/dashboard/rent/[id]`) shows Stripe checkout
session history for the authenticated landlord:

| Display state | Meaning |
|---------------|---------|
| Awaiting payment | Open checkout link for the current (or matching) outstanding amount |
| Expired | Checkout link expired — create a new link |
| Payment recorded | `reconciled_at` is set — rent was updated by webhook |
| Processing | Checkout completed on Stripe but not yet reconciled in RentPilot |
| Outdated link | Session amount no longer matches current outstanding balance |
| Could not record | Reconciliation failed safely — verify rent status manually |

**Confirmation rule:** Returning from Stripe Checkout (`?checkout=success`) is
**not** payment confirmation. Only `reconciled_at` on a checkout session (via
webhook reconciliation) confirms the payment was recorded.

**Currency / region:** RentPilot creates **US Connect Express** accounts and
**USD** checkout sessions only (`country: "US"` in Connect onboarding). Stripe
account availability depends on Stripe's policies; some countries (including
India) may be invite-only. RentPilot does not bypass Stripe country
restrictions.

**Demo mode:** No Stripe API calls, no real checkout sessions in Supabase.
Demo may show simulated session fixtures for UI preview only.

**Secrets for live E2E** (server-only, never `NEXT_PUBLIC_*`):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

## Owner consistency enforcement (0012)

Migration `0012_owner_consistency.sql` adds database-level triggers that
prevent cross-landlord data leakage. These fire on INSERT/UPDATE for
`tenants`, `rent_payments`, `rent_reminder_logs`, `stripe_checkout_sessions`,
and `payment_collection_sessions`, verifying that all related records share
the same `owner_id`.

**Preflight check:** run the read-only queries in the migration header
before applying. They report any existing inconsistent rows. The migration
never deletes or repairs data — existing bad rows must be resolved manually.

Apply after `0009`:

```sql
-- In Supabase SQL editor:
-- Paste contents of supabase/migrations/0012_owner_consistency.sql
```

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```

### Generating Supabase types

`src/lib/types/database.ts` is hand-authored to match `supabase/migrations/0001_init.sql`.
When your Supabase project is connected, you can regenerate it with the Supabase CLI
(no service-role key required — uses your logged-in CLI session or project ref):

```bash
# Option A: linked local project (after `supabase link`)
npx supabase gen types typescript --linked > src/lib/types/database.ts

# Option B: remote project by ID (from Supabase dashboard → Project Settings → General)
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/lib/types/database.ts
```

After regenerating, run `npm run build` to verify types still align with the service layer.
Do not commit `.env.local` or any service-role keys.

## Security

- Service-role keys are never exposed to the browser. The service role is
  used only by the Stripe webhook handler (`/api/webhooks/stripe`) to write
  webhook events and reconcile payments (tables with RLS and no landlord
  policies).
- All Supabase access uses the public anon key from the browser/server,
  protected entirely by Row Level Security policies scoped to
  `auth.uid()`.
- Protected routes (`/dashboard/**`) are enforced in `src/proxy.ts`
  (Next.js Proxy/Middleware), which redirects unauthenticated users to
  `/login` and refreshes the Supabase session cookie on every request.
