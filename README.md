# bIDE — Browser IDE in the PocketBI ecosystem

**bIDE** is the browser coding and data IDE at `bideide.com`. It is part of the PocketBI ecosystem and uses PocketBI ID plus the shared PocketBI backend for account-connected services and entitlements.

The web app is React + Vite with Monaco editing, browser runtimes, local datasets/workspaces, plotting/data tools, documentation, PocketBI handoffs, and optional bring-your-own-key Code Assist.

## Production model

- Normal coding/data work is local-first in the browser.
- PocketBI ID is used for explicit account/cloud/share features.
- PocketBI's shared backend owns billing, subscription state, entitlements, organizations, and account lifecycle.
- bIDE does **not** run a separate Stripe subscription stack.
- The current paid entitlement is resolved through the shared PocketBI contract (for example `bide.pro`).

See `POCKETBI_PLATFORM_BACKEND.md`, `BACKEND_SETUP.md`, and `STRIPE_SETUP.md` for the backend boundary.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS / Radix UI components
- Monaco Editor
- Browser execution for the currently supported runtime set, including Python/Pyodide, R/webR-compatible flows, JavaScript, and SQL/sql.js
- IndexedDB/local browser workspace persistence
- Supabase client for PocketBI-connected account/product features
- PocketBI dataset handoff V1
- PWA support

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

The IDE should remain useful in local/offline mode when optional account-connected services are unavailable.

## Quality commands

```bash
npm run build
npm run lint
npm run test:python-runtime-errors
npm run test:sql-analyst
npm run test:r-runtime
npm run test:retired-billing
```

`npm run build` runs the product integrity/regression guards before the Vite production build.

## Backend rules

The canonical PocketBI Platform project is documented in `POCKETBI_PLATFORM_BACKEND.md`. Do not deploy historical Edge Functions blindly.

Retired standalone bIDE billing/account functions are intentionally absent from deployable source:

- `create-checkout`
- `check-subscription`
- `cancel-subscription`
- `reactivate-subscription`
- `sync-subscription`
- `stripe-webhook`
- `delete-account`

Shared PocketBI services own those responsibilities. Account deletion uses the shared `delete-pocketbi-account` service.

## Environment

`.env.example` contains public PocketBI/Supabase configuration placeholders and optional server-side provider placeholders. It intentionally does **not** contain standalone bIDE Stripe secrets or a bIDE Stripe price ID.

Never expose service-role keys or provider secrets in Vite/browser variables and never commit real credentials.

## Deployment

- Production web deployments come from `main` through the connected Vercel project.
- Deliberate preview branches may deploy when allowed by `vercel.json`; native-only branch work should not consume web previews.
- Shared backend/schema changes must respect the PocketBI platform contract rather than creating product-local copies of identity or billing state.

## Release focus

The current web release lane is maintenance/hardening: runtime correctness, imports/exports, workspace persistence, account boundaries, cross-product handoffs, and truthful public surfaces. Native iOS work is intentionally isolated from this web lane.
