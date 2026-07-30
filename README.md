# Throuly Scout

Privacy-first real estate platform: home affordability analysis, property search, buyer assistance programs, and an AI real-estate assistant — covering all 50 US states.

Production: [throulyscout.com](https://throulyscout.com) (`throuly.com` redirects here)

## Tech stack

- **Frontend:** Vite + React 18 + TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query
- **Backend:** Supabase — Postgres (with row-level security), Auth, and Deno edge functions. There is no separate app server; the SPA talks to Supabase directly, and edge functions handle everything that needs secrets or server-side enforcement.
- **Services:** Google Gemini (AI features), Resend (email), Stripe (payments), Firecrawl (listing scraping), Google Maps (address autocomplete)
- **Hosting:** Netlify (config in `netlify.toml`)

## Prerequisites

- Node.js 22+ and npm
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)
- A Supabase account (free tier is fine for development)

## Local setup

### 1. Install dependencies

```sh
git clone git@github.com:throuly-inc/throulyscout.git
cd throulyscout
npm install
```

### 2. Create a Supabase project

Create a project at [supabase.com/dashboard](https://supabase.com/dashboard), then apply the schema:

```sh
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

This runs every migration in `supabase/migrations/` — tables, RLS policies, triggers, and the email queue infrastructure.

### 3. Configure environment

Create `.env.local` in the project root (values from Supabase dashboard → Settings → API):

```sh
VITE_SUPABASE_URL="https://<YOUR_PROJECT_REF>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your publishable/anon key>"
```

These are the only frontend variables. Both are public-by-design (RLS protects the data), but `.env.local` stays untracked.

### 4. Auth redirect

In the Supabase dashboard → Authentication → URL Configuration, add to Redirect URLs:

```
http://localhost:8080/**
```

### 5. Run

```sh
npm run dev
```

App runs at [http://localhost:8080](http://localhost:8080). Sign up with a test account — auth, database, and all non-function features work at this point.

## Edge functions

The 13 functions in `supabase/functions/` handle payments, AI, third-party proxies, and the email queue. Deploy them (all or by name):

```sh
supabase functions deploy
```

Set the secrets for the features you need:

| Secret | Needed for | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | `chat`, `analyze-property`, `analyze-address`, `get-assistance-programs` | [Google AI Studio](https://aistudio.google.com/); free tier available |
| `RESEND_API_KEY` | `process-email-queue` | [Resend](https://resend.com/); free tier available |
| `EMAIL_FROM` | `process-email-queue` | Optional override, e.g. `Throuly <no-reply@throuly.com>`; must be on a Resend-verified domain |
| `ENVIRONMENT` | `process-email-queue` | Set to `production` on the production project only. Anywhere else (including unset), email subjects get a `[STAGING]` prefix |
| `STRIPE_SECRET_KEY` | `create-checkout`, `customer-portal`, `check-subscription` | Use `sk_test_...` outside production |
| `FIRECRAWL_API_KEY` | `analyze-property`, `analyze-address`, `parse-property-listing` | Optional; analyzers fall back to AI estimates without it |
| `GOOGLE_MAPS_API_KEY` | `places-autocomplete` | |
| `TURNSTILE_SECRET_KEY` | `waitlist-signup` | Optional; captcha is skipped when unset |

```sh
supabase secrets set GEMINI_API_KEY=... RESEND_API_KEY=...
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — never set them manually.

### Email queue

Emails are queued in Postgres (pgmq) and sent by `process-email-queue`. Automatic processing requires two one-time manual steps on the Supabase project (a vault secret and a `pg_cron` job) — see the notes at the bottom of `supabase/migrations/20260620001715_email_infra.sql`. Local/dev environments can skip this; nothing else depends on it.

## Testing

```sh
npm run lint        # ESLint
npx vitest          # unit tests
```

Browser e2e tests live in `tests/e2e/` (Python + Playwright against a running dev server) — see `tests/e2e/README.md`.

## Deployment

Netlify builds from this repo on every push to `main`:

- Build settings come from `netlify.toml` (`npm run build`, publishes `dist/`, SPA fallback redirect).
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Netlify site's environment variables, pointing at the Supabase project for that environment.
- Add the deployed URL to that Supabase project's Auth Redirect URLs.

Database and edge functions deploy separately via the Supabase CLI (`supabase db push`, `supabase functions deploy`).

## Project structure

```
src/
  pages/          # Route components (marketing, guides, dashboards, tools)
  components/     # Feature components + shadcn/ui primitives (components/ui)
  contexts/       # Auth, subscription, privacy providers
  hooks/          # Shared hooks
  integrations/   # Supabase client + generated DB types
  lib/            # State data, calculators, utilities
supabase/
  migrations/     # Database schema (applied in order by `supabase db push`)
  functions/      # Deno edge functions
scripts/          # Sitemap generation (runs pre-dev/build), user migration
tests/e2e/        # Playwright browser tests
docs/             # Security/architecture notes
```
