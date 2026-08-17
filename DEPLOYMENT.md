# RentPilot Deployment Guide

## Prerequisites

- **Node.js** 20+ (recommended: 22 LTS)
- **npm** 10+
- **Supabase** project (free tier works)
- **Vercel** account (free tier works)
- **Razorpay** account (for Indian rent collection)
- **GitHub** account (for repository hosting)

Optional:
- **OpenAI API key** (for AI features beyond chat)
- **Resend API key** (for email reminders)
- **Stripe account** (legacy/frozen — not required)

## Environment Variables

### Required for Production

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase service role key (webhook DB writes) |
| `NEXT_PUBLIC_APP_URL` | Client | Production URL (e.g., `https://rentpilot.vercel.app`) |

### Required for Razorpay

| Variable | Scope | Description |
|----------|-------|-------------|
| `RAZORPAY_KEY_ID` | Server | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Server | Razorpay API key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Server | Razorpay webhook signing secret |
| `PAYMENT_COLLECTION_PROVIDER` | Server | Set to `razorpay` |

### Optional

| Variable | Scope | Description |
|----------|-------|-------------|
| `AI_BASE_URL` | Server | AI provider URL (default: local Ollama) |
| `AI_API_KEY` | Server | AI provider API key |
| `AI_MODEL` | Server | AI model name (default: `llama3.2`) |
| `OPENAI_API_KEY` | Server | OpenAI key for service features |
| `OPENAI_MODEL` | Server | OpenAI model (default: `gpt-5-mini`) |
| `RESEND_API_KEY` | Server | Resend email API key |
| `EMAIL_FROM` | Server | Sender email address |
| `DEFAULT_CURRENCY` | Server | Currency code (default: `inr`) |

### Not Required

| Variable | Status |
|----------|--------|
| `STRIPE_SECRET_KEY` | Legacy/frozen — not needed |
| `STRIPE_WEBHOOK_SECRET` | Legacy/frozen — not needed |

## Supabase Setup

### 1. Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note the project URL and anon key from Settings → API

### 2. Run Migrations
All migrations are in `supabase/migrations/`. Apply them in order (0001–0012):

```bash
npx supabase db push
```

Or apply manually via the Supabase SQL editor.

### 3. Configure Auth
In Supabase Dashboard → Authentication → Providers:
- Enable **Email** provider (default)
- Set **Site URL** to your production URL
- Add your production URL to **Redirect URLs**: `https://your-domain.vercel.app/auth/callback`

### 4. Verify RLS
RLS is enabled on all 9 tables via migrations. Verify in Supabase Dashboard → Authentication → Policies.

## Razorpay Setup

### 1. Create Account
1. Go to [razorpay.com](https://razorpay.com) → Sign up
2. Complete KYC verification

### 2. Get API Keys
1. Dashboard → Settings → API Keys → Generate Key
2. Note the Key ID and Key Secret

### 3. Configure Webhooks
1. Dashboard → Settings → Webhooks → Add New Webhook
2. **URL**: `https://your-domain.vercel.app/api/webhooks/razorpay`
3. **Events**: `payment.captured`, `payment.failed`, `order.paid`
4. Note the webhook signing secret

## AI Setup

### Option A: Local Ollama (Development)
No configuration needed. Ollama runs at `127.0.0.1:11434` by default.

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull model
ollama pull llama3.2

# Start server
ollama serve
```

### Option B: Production AI Provider
Set these environment variables to any OpenAI-compatible endpoint:

```
AI_BASE_URL=https://your-ai-provider.com/v1
AI_API_KEY=your-api-key
AI_MODEL=your-model-name
```

Compatible providers: OpenAI, Together AI, Groq, Fireworks, Novita, Deepseek, or any OpenAI-compatible API.

## Vercel Deployment

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial production deployment"
git remote add origin https://github.com/yourusername/rentpilot.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → Import Project
2. Select your GitHub repository
3. Vercel auto-detects Next.js — no configuration needed
4. Click **Deploy**

### 3. Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add all required variables:

**Production** environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` = `https://your-domain.vercel.app`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `PAYMENT_COLLECTION_PROVIDER` = `razorpay`

**Optional** (add if using):
- `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `RESEND_API_KEY`, `EMAIL_FROM`

### 4. Deploy
Vercel auto-deploys on push to `main`. Preview deployments happen on PRs.

### 5. Configure Domain (Optional)
1. Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update `NEXT_PUBLIC_APP_URL` to match

## Post-Deployment Smoke Tests

### Authentication
- [ ] Visit `/` — landing page loads
- [ ] Visit `/login` — login form renders
- [ ] Visit `/signup` — signup form renders
- [ ] Visit `/dashboard` unauthenticated — redirects to `/login`
- [ ] Sign up with email — confirmation email sent (if Resend configured)
- [ ] Log in — redirects to `/dashboard`

### Dashboard
- [ ] Dashboard loads with KPI cards
- [ ] Portfolio health widget renders
- [ ] Rent collection overview shows data
- [ ] Recent activity populates
- [ ] Quick actions are clickable

### Properties
- [ ] `/dashboard/properties` — list loads
- [ ] `/dashboard/properties/new` — form renders
- [ ] Create a property — success redirect
- [ ] Property detail page loads
- [ ] Edit property — form pre-fills

### Tenants
- [ ] `/dashboard/tenants` — list loads
- [ ] `/dashboard/tenants/new` — form renders
- [ ] Create a tenant — success redirect
- [ ] Tenant detail page loads
- [ ] Edit tenant — form pre-fills

### Rent
- [ ] `/dashboard/rent` — operations center loads
- [ ] Status breakdown shows (paid/pending/overdue)
- [ ] Overdue section populates if applicable
- [ ] Upcoming section populates if applicable
- [ ] Create rent payment — form works
- [ ] Rent detail page loads

### Payments
- [ ] `/dashboard/payments` — list loads
- [ ] Payment detail loads

### AI
- [ ] `/dashboard/ai` — intelligence hub loads
- [ ] Portfolio brief shows metrics
- [ ] Priority list populates
- [ ] Send a message — AI responds
- [ ] Empty input — rejected gracefully
- [ ] Oversized input (>4000 chars) — rejected

### API
- [ ] `GET /api/ai` — returns 405 (method not allowed)
- [ ] `POST /api/ai` unauthenticated — returns 401
- [ ] `POST /api/webhooks/razorpay` — returns 400 (no payload)

### Security
- [ ] No secrets in browser source (View Page Source)
- [ ] No `NEXT_PUBLIC_` variables expose server secrets
- [ ] RLS blocks cross-user data access
- [ ] Webhook endpoints verify signatures
