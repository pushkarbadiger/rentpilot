<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

RentPilot — rental property management SaaS for Indian landlords. Next.js 16 (App Router), React 19, Tailwind v4, Supabase (Postgres + RLS), Zod v4, Stripe + Razorpay payments.

## Commands

| What | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build (also type-checks) | `npm run build` |
| Lint | `npm run lint` |
| Payment provider self-check | `npm run verify:payments` |

There is **no standalone typecheck script** — `next build` is the only TS check. There is **no test framework** configured. Run `npm run lint` then `npm run build` to verify changes.

## Architecture

- **Demo mode is first-class.** Every service in `src/lib/services/` checks `isSupabaseConfigured` and falls back to in-memory demo data. The app runs fully without any backend.
- **Two AI integration points coexist:**
  - `src/app/api/ai/route.ts` — chat UI, hits local Ollama at `127.0.0.1:11434` (model: `llama3.2`).
  - `src/lib/services/ai/index.ts` — service layer (rent reminders, classification), uses OpenAI SDK with `OPENAI_API_KEY` (model: `gpt-5-mini`).
- **Payment providers:** Razorpay is the active default for India. Stripe is legacy/frozen. Controlled by `PAYMENT_COLLECTION_PROVIDER` env var (`razorpay` | `stripe` | `none`).
- **Proxy, not middleware:** Auth middleware lives in `src/proxy.ts` (exports `proxy()` + `config`), not the conventional `middleware.ts`. This is a Next.js 16 pattern.
- **No Tailwind config file.** Tailwind v4 uses CSS-first config via `@theme inline` in `src/app/globals.css`.

## Structure

```
src/
  app/           # Next.js App Router — pages, layouts, API routes
    (auth)/      # Login/signup route group
    api/         # REST API routes + webhooks
    dashboard/   # Protected app shell (auth-gated in layout.tsx)
  components/    # React components (forms/, ui/, layout/, landing/, payments/)
  lib/
    services/    # Business logic — all data access goes through here
    types/       # database.ts (hand-authored Supabase types), domain.ts
    supabase/    # Client/server Supabase helpers, middleware
supabase/migrations/  # SQL migrations (0001–0012)
```

## Conventions

- **Currency:** INR by default (`formatCurrency` in `src/lib/utils.ts` uses `en-IN` + `INR`).
- **Path alias:** `@/*` maps to `./src/*` (tsconfig).
- **Validation:** Zod v4 schemas in `src/lib/validation.ts`.
- **Database types:** Hand-authored at `src/lib/types/database.ts` (357 lines). Regenerate with `npx supabase gen types typescript --project-id REF > src/lib/types/database.ts`.
- **Owner scoping:** Every data table has `owner_id` — all queries must filter by it.
- **RLS is enforced** on profiles, properties, tenants, rent_payments.

## Environment

`.env.example` lists all vars. Required for real mode: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`. Optional: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`/`KEY_SECRET`, `RESEND_API_KEY`, `OPENAI_API_KEY`.

## Gotchas

- `src/app/dashboard/ai/page.tsx.save` and `.rentpilot-backup/` are editor leftovers — ignore them.
- No pre-commit hooks, no CI workflows, no Prettier config.
- The `page.tsx.save` file is an unsaved editor backup, not source.
