# bIDE by CodeMix — Buyer-Ready Browser IDE Starter SaaS

**bIDE** is the primary product brand and **bideide.com** is the primary domain. **CodeMix** is the package/studio name; use **“bIDE by CodeMix”** when referencing both. **codemixapp.com** is included as a secondary/redirect domain candidate.

bIDE is a React + Vite browser IDE starter package for running and learning code in the browser. It includes a Monaco editor, multi-language runtime adapters, data-science utilities, docs/SEO pages, optional Supabase auth/cloud features, optional Supabase Edge Function AI tools, and optional Stripe subscription scaffolding.

## Current status

This repository is prepared as a buyer-configurable starter SaaS. The frontend installs, builds, previews, and runs without real backend secrets. Supabase, AI, and Stripe features are disabled/fail gracefully until the buyer supplies their own credentials and deploys the included backend.

## Tech stack

- React 18, TypeScript, Vite
- Tailwind CSS + shadcn/ui-style Radix components
- Monaco Editor
- Browser runtimes/adapters for JavaScript, Python/Pyodide, R, SQL/sql.js, PHP, Ruby, Lua, and editor-only languages
- Supabase client, migrations, and Edge Functions for optional auth/cloud/share/AI/payment flows
- Stripe Edge Function scaffolding for subscriptions
- PWA support via vite-plugin-pwa

## Fresh clone setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open the dev server printed by Vite. This project is configured for `http://localhost:8080` by default.

## Common commands

```bash
npm install          # install pinned dependencies from package-lock.json
npm run dev          # local Vite dev server
npm run lint         # ESLint checks
npm run build        # production build
npm run preview      # preview the production build locally
```

## Environment variables

Copy `.env.example` to `.env`. The app works in local/offline mode without these values, but buyer-owned values are required for hosted auth, cloud workspaces, sharing, AI Edge Functions, and paid plans.

Frontend variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_PUBLIC_SITE_URL`

Server/Edge Function secrets, configured in Supabase rather than exposed in frontend bundles:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` or buyer-selected AI gateway credentials
- `LOVABLE_API_KEY` if continuing to use the current AI gateway implementation
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`

Never commit `.env` or real credentials.

## Deployment steps

1. Create buyer-owned Supabase and Stripe accounts.
2. Apply Supabase migrations from `supabase/migrations`.
3. Configure Supabase Edge Function secrets from `.env.example`.
4. Deploy Edge Functions from `supabase/functions`.
5. Configure Stripe products, prices, and webhooks.
6. Deploy the Vite app to Vercel, Netlify, Cloudflare Pages, or similar.
7. Point `bideide.com` at the frontend host and redirect `codemixapp.com` if desired.

## Known limitations

- Backend features are buyer-configurable, not live by default.
- AI functions require server-side credentials and may need provider migration if the buyer does not use the included AI gateway pattern.
- Stripe checkout is disabled until `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID` are set.
- Some language runtimes rely on browser/WebAssembly support and CDN/runtime loading behavior.
- Build emits large chunk warnings; this is acceptable for handoff but code-splitting is a recommended post-sale improvement.
