# Backend Setup — bIDE web

## Production authority

bIDE web uses the shared PocketBI Platform backend. The canonical Supabase project is documented in `POCKETBI_PLATFORM_BACKEND.md` and owns PocketBI ID, account lifecycle, billing sources, subscriptions, entitlements, organizations, credits, and shared product access.

Do **not** create or deploy a separate bIDE subscription stack.

## Product-specific Edge Functions

Only deploy a bIDE-specific Edge Function when the current web application intentionally uses it and its authentication, abuse controls, and secrets have been reviewed. Historical functions may remain in git history, but they are not part of the production deployment contract.

The retired standalone bIDE functions are:

- `create-checkout`
- `check-subscription`
- `cancel-subscription`
- `reactivate-subscription`
- `sync-subscription`
- `stripe-webhook`
- `delete-account`

Billing and account deletion must go through the shared PocketBI services instead. In particular, the canonical account-deletion service is `delete-pocketbi-account`, not the retired bIDE function.

## Current local configuration

`supabase/config.toml` is linked to the shared PocketBI project so migrations and explicitly approved bIDE product functions can be managed consistently. It intentionally does not declare the retired billing/account functions above.

Set secrets only for functions that are deliberately deployed. Never expose service-role keys or provider secrets to Vite/browser code.

## Local/offline behavior

The browser IDE keeps its local-first coding/data workflow usable without silently uploading workspace files. PocketBI ID and explicit cloud/share features require the shared backend; local editing and supported browser runtimes should fail gracefully when an optional connected service is unavailable.

## Release rule

Before deploying any Edge Function from this repository:

1. confirm the frontend or shared contract still calls it;
2. confirm the canonical PocketBI project does not already provide the capability;
3. require authentication or a documented custom-auth boundary;
4. add rate/abuse controls where the endpoint can consume paid compute or third-party APIs;
5. add a regression that prevents old standalone billing/account architecture from returning.
