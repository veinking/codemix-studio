# Handoff — bIDE web

## Product position

bIDE is the browser coding/data IDE in the PocketBI ecosystem. `bideide.com` is its public domain, while PocketBI provides the shared identity, billing, entitlement, and organization authority.

## Project structure

- `src/pages` — landing, IDE, auth/account, docs, support, legal, and handoff routes.
- `src/components` — editor UI, datasets, plots, workspaces, dialogs, and responsive layouts.
- `src/runtimes` — browser runtime adapters.
- `src/hooks` — local storage, workspace, device, and account helpers.
- `src/integrations/pocketbi` — PocketBI identity/handoff integration.
- `src/integrations/supabase` — shared-backend client/types.
- `supabase/functions` — only current bIDE-specific Edge Function source; shared account/billing functions are owned outside this repo.
- `supabase/migrations` — bIDE product-data schema history and current hardening migrations.

## Current release boundary

Normal web coding/data workflows should remain local-first. PocketBI ID is used for explicit account-connected services and entitlements; files are not silently synced just because a user signs in.

The current production billing model has **no standalone bIDE subscription**. Do not restore or deploy historical bIDE checkout/subscription functions. Shared PocketBI billing is the only paid-access authority.

Retired standalone functions include `create-checkout`, `check-subscription`, `cancel-subscription`, `reactivate-subscription`, `sync-subscription`, `stripe-webhook`, and `delete-account`.

For account deletion, use the shared `delete-pocketbi-account` service. For paid access, read the shared PocketBI entitlement contract such as `bide.pro`.

## Deployment

- Web frontend: Vercel production from `main`.
- Shared backend: canonical PocketBI Supabase project documented in `POCKETBI_PLATFORM_BACKEND.md`.
- Only deploy bIDE-specific Edge Functions after confirming the current frontend intentionally calls them and authentication/abuse controls are adequate.

## Release checks

Before shipping web changes:

1. run the bIDE Quality workflow and production build;
2. verify Python/R/SQL normal execution and recoverable error behavior;
3. verify multi-file import and local workspace persistence;
4. verify PocketBI handoff fallback behavior;
5. verify public Support/Privacy/Terms remain consistent with the shared PocketBI account/billing model;
6. do not merge native iOS release work into this web release lane.

## Known acceptance work

The remaining Python-runtime issue is code-fixed and production-deployed but should stay open until the exact success → deliberate error → last-good-output → retry sequence is manually observed on `bideide.com/ide`.

Historical sale-package and standalone billing instructions are not the production deployment contract.
