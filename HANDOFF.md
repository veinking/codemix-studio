# Handoff — bIDE by CodeMix

## Sale positioning

bIDE by CodeMix is a browser IDE starter SaaS package, not a revenue-generating business. The package is prepared for buyer setup and customization around the primary domain `bideide.com`. The secondary domain `codemixapp.com` may be included as a redirect/secondary domain if the seller chooses to transfer it separately.

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

## Buyer-owned services required before launch

- Buyer must create their own Supabase project and apply the included migrations/functions.
- Buyer must add their own Stripe credentials, product, price, webhook, and payment policies.
- Buyer must add their own OpenAI or AI gateway credentials for AI Edge Functions.
- No customer database is included.
- No email list is included.
- No social media accounts are included unless separately transferred.
- No Stripe/payment account transfer is included.

## What needs finishing

- Buyer must create and configure Supabase.
- Buyer must configure AI provider credentials and validate prompts/quotas.
- Buyer must create Stripe account/products/prices/webhooks.
- Buyer should perform browser QA for each runtime and mobile device class before launch.
- Buyer should decide whether `codemixapp.com` redirects to `bideide.com` or hosts a secondary landing page if included.

## Backend notes

Supabase is optional in local mode and required for auth, cloud workspace, sharing, usage tracking, recipes/activity, account management, and subscription sync. See `BACKEND_SETUP.md`.

## AI notes

AI tooling is implemented through Supabase Edge Functions. API keys are server-side only. Missing frontend Supabase config prevents AI calls gracefully.

## Payment notes

Stripe checkout is disabled by default. `create-checkout` requires `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID`; webhook sync requires `STRIPE_WEBHOOK_SECRET`. No Stripe account is included in the sale.

## Deployment notes

Deploy static frontend to Vercel/Netlify/Cloudflare Pages. Deploy backend to buyer-owned Supabase. Use `bideide.com` as the primary canonical domain and redirect `codemixapp.com` if included.

## Known limitations and post-sale improvements

- Build may warn about large JavaScript chunks because bIDE includes Monaco, Pyodide/runtime adapters, sql.js-style browser IDE dependencies, docs pages, and data tools.
- Recommended future optimization: lazy-load Monaco, Pyodide/runtime adapters, docs pages, and data tools.
- Runtime behavior should be manually retested in target browsers after deployment.
