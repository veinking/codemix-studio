# Stripe Setup — shared PocketBI billing

## Standalone bIDE Stripe is retired

bIDE does **not** operate a separate Stripe subscription, checkout, cancellation, reactivation, or webhook stack.

PocketBI's shared billing backend is the canonical authority for paid access across the ecosystem. bIDE consumes the resulting PocketBI entitlements (for example `bide.pro`) rather than creating its own Stripe customer/subscription lifecycle.

Do not deploy these historical bIDE functions:

- `create-checkout`
- `check-subscription`
- `cancel-subscription`
- `reactivate-subscription`
- `sync-subscription`
- `stripe-webhook`

Their deployable source has been removed from the current branch. Historical implementations remain available through git history only.

## Current billing flow

1. A customer signs in with PocketBI ID.
2. PocketBI's canonical web billing flow creates/manages Stripe checkout or the billing portal.
3. The canonical PocketBI webhook normalizes subscription state into the shared backend.
4. Effective entitlements are resolved from the shared plan/account or organization contract.
5. bIDE reads shared access; it does not maintain a second subscription record.

Account deletion follows the same rule: use the shared `delete-pocketbi-account` service rather than a bIDE-specific deletion function.

## Release safety

- Never add `STRIPE_SECRET_KEY`, Stripe webhook secrets, or private price IDs to bIDE browser code.
- Never restore a standalone `STRIPE_PRO_PRICE_ID` flow for bIDE.
- Do not create a separate bIDE Stripe product as a shortcut around PocketBI entitlements.
- Changes to shared pricing, checkout, portal, webhooks, or entitlement normalization belong in the canonical PocketBI/Datasnap billing path.

See `POCKETBI_PLATFORM_BACKEND.md` for the shared backend boundary.
