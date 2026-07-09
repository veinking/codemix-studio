# Handoff — bIDE by CodeMix

## Project structure

- `src/pages` — landing, IDE, auth/account, pricing, docs, tutorials, blog/use-case pages.
- `src/components` — editor UI, dialogs, data science tools, layout, shadcn-style UI primitives.
- `src/runtimes` — runtime adapters for executable/editor languages.
- `src/hooks` — auth/cloud/AI/local storage/device hooks.
- `src/integrations/supabase` — typed Supabase client and generated DB types.
- `supabase/migrations` — database schema migrations.
- `supabase/functions` — Edge Functions for AI, subscriptions, account, and webhooks.
- `public` — icons, manifest, sitemap, worker assets.

## What works

- Fresh `npm install`.
- Vite dev server.
- Production build and preview.
- Landing/marketing pages.
- Browser IDE shell with language selection and editor UI.
- Local/offline operation when Supabase is not configured.
- Build-time TypeScript/Vite checks.

## What needs finishing

- Buyer must create and configure Supabase.
- Buyer must configure AI provider credentials and validate prompts/quotas.
- Buyer must create Stripe account/products/prices/webhooks.
- Buyer should perform browser QA for each runtime and mobile device class before launch.
- Buyer should decide whether codemixapp.com redirects to bideide.com or hosts a secondary landing page.

## Backend notes

Supabase is optional in local mode and required for auth, cloud workspace, sharing, usage tracking, recipes/activity, account management, and subscription sync. See `BACKEND_SETUP.md`.

## AI notes

AI tooling is implemented through Supabase Edge Functions. API keys are server-side only. Missing frontend Supabase config prevents AI calls gracefully.

## Payment notes

Stripe checkout is disabled by default. `create-checkout` now requires `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID` instead of a hardcoded price ID.

## Deployment notes

Deploy static frontend to Vercel/Netlify/Cloudflare Pages. Deploy backend to buyer-owned Supabase. Use bideide.com as the primary canonical domain and redirect codemixapp.com if included.
