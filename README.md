# RentPilot

**Your rental portfolio, on autopilot.**

RentPilot is an AI-ready rental property management platform for landlords
and property managers. This is the **Phase 1 MVP**: the core SaaS
foundation — landing page, authentication, dashboard, property management,
tenant management, and rent tracking — built on Next.js and Supabase, with
clean service boundaries ready for AI automation, payments, and
multi-user organizations in later phases.

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

3. Fill in your project's URL and anon key (Project Settings -> API):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run the schema migration. Easiest path: open the Supabase SQL editor
   and paste the contents of `supabase/migrations/0001_init.sql`, then
   run it. (Or, if you use the Supabase CLI: `supabase db push`.)

   This creates `profiles`, `properties`, `tenants`, and `rent_payments`,
   with UUID primary keys, foreign keys, indexes, `created_at` /
   `updated_at` timestamps, and **Row Level Security** policies scoping
   every table to `auth.uid()` — each landlord can only ever see their
   own data. A trigger automatically creates a `profiles` row whenever
   someone signs up.

5. In Supabase Auth settings, make sure **Email** sign-in is enabled
   (it is by default). For local development you can disable "Confirm
   email" under Auth -> Providers -> Email so you can sign in immediately
   after signing up.

6. Restart `npm run dev`. The demo banner disappears and `/signup` /
   `/login` create and authenticate real users backed by Supabase.

No service-role key is required for Phase 1, and none is ever sent to
the browser — everything runs through the anon key plus Row Level
Security.

## Project structure

```
src/
  app/
    page.tsx                  # Landing page
    (auth)/login, /signup     # Auth pages (route group, shared layout)
    auth/actions.ts           # Server actions: sign up / login / logout
    auth/callback/route.ts    # Supabase auth callback (email/OAuth)
    dashboard/                # Protected app (layout checks auth)
      page.tsx                # Overview: stats, activity, quick actions
      properties/             # List, new, [id], [id]/edit
      tenants/                # List, new, [id], [id]/edit
      rent/                   # List/overview, new, [id]/edit
    api/                      # REST-style API routes (same services layer)
  components/
    ui/                       # Button, Card, Field, Badge, EmptyState, ...
    layout/                   # Sidebar, Header, MobileNav, UserMenu
    landing/                  # Hero, Features, ProductPreview, Footer
    forms/                    # PropertyForm, TenantForm, RentPaymentForm
    dashboard/                # StatCard-driven widgets for the overview
  lib/
    supabase/                 # Browser client, server client, middleware
    services/                 # properties, tenants, rent-payments, dashboard
    services/ai/              # Provider-agnostic AI interfaces (Phase 2+)
    types/                    # Domain types + hand-authored Database type
    demo-data.ts              # Realistic fallback dataset
    validation.ts             # Zod schemas shared by forms + API routes
supabase/
  migrations/0001_init.sql    # Full schema + RLS policies
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

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```

## Security

- Service-role keys are never used or exposed in Phase 1.
- All Supabase access uses the public anon key from the browser/server,
  protected entirely by Row Level Security policies scoped to
  `auth.uid()`.
- Protected routes (`/dashboard/**`) are enforced in `src/proxy.ts`
  (Next.js Proxy/Middleware), which redirects unauthenticated users to
  `/login` and refreshes the Supabase session cookie on every request.
