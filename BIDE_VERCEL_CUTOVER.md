# bIDE Vercel cutover

This is the deployment contract for moving `bideide.com` to the canonical
`veinking/codemix-studio` repository without breaking PocketBI ID.

## Canonical ownership

- Source: `veinking/codemix-studio`, production branch `main`
- Production domain: `https://bideide.com`
- Identity and entitlements: Supabase project `bozkwngfioubgwzvzfif`
- Supabase dashboard label: `PocketBI Identity & Billing — Production`
- OAuth callback: `https://bideide.com/auth/pocketbi/callback`

## Required Vercel production variables

Only the following values belong in the Vite frontend. They are public
configuration, not server secrets.

```text
VITE_SUPABASE_URL=https://bozkwngfioubgwzvzfif.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<PocketBI publishable key>
VITE_POCKETBI_OAUTH_CLIENT_ID=9bec3e2f-0984-47eb-8ea0-b3acf5d3b983
VITE_POCKETBI_OAUTH_REDIRECT_URI=https://bideide.com/auth/pocketbi/callback
VITE_PUBLIC_SITE_URL=https://bideide.com
```

Never add `SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets, or provider API secrets
to a `VITE_` variable. Vite exposes every `VITE_` value to the browser.

## Preview OAuth rule

Do not point a Vercel Preview deployment at the production OAuth callback.
PKCE transaction state is stored on the initiating browser origin, so a flow
started on a `vercel.app` Preview and returned to `bideide.com` cannot complete.

For pre-cutover OAuth testing, register a separate public Supabase OAuth client
with the exact stable Preview callback, then branch-scope both Preview variables:

```text
VITE_POCKETBI_OAUTH_CLIENT_ID=<preview client id>
VITE_POCKETBI_OAUTH_REDIRECT_URI=https://<stable-preview-host>/auth/pocketbi/callback
```

If a stable Preview hostname is not available, test the final OAuth round trip
immediately after attaching `bideide.com`, with the old host retained as the
rollback target.

## One-deployment sequence

1. Create the Vercel project and connect this repository without deploying.
2. Set the framework preset to Vite and production branch to `main`.
3. Add the required production variables above.
4. Run `npm ci`, `npm run lint`, and `npm run build` locally or in GitHub Actions.
5. Produce one production deployment from the verified commit.
6. Confirm the temporary Vercel URL loads `/`, `/ide`, and `/account`.
7. Attach `bideide.com`; keep the old publisher available for rollback.
8. Verify `/auth/pocketbi/callback` returns the SPA rather than a platform 404.
9. Run the PocketBI ID test matrix below.
10. Remove the old publisher only after DNS, TLS, OAuth, and refresh survive.

## PocketBI ID test matrix

1. Signed out of both sites: bIDE opens PocketBI Account Home, permits sign-in,
   shows consent, and returns to `/ide` signed in.
2. Already signed in to PocketBI: bIDE reaches consent without another password
   prompt and returns signed in.
3. Refresh `/ide`: the bIDE session restores and entitlements load.
4. Wait for or simulate access-token refresh: the refresh token renews the local
   bIDE session without a visible login loop.
5. Sign out of bIDE: bIDE becomes a guest but the PocketBI browser session remains.
6. Reconnect bIDE: the existing PocketBI session avoids password entry.
7. Revoke bIDE from PocketBI Account Home: the next refresh fails closed and bIDE
   returns to guest access.
8. A PocketBI Pro account reports `bide.pro`; a Free account does not.

## Rollback conditions

Rollback the domain if any of these fail:

- `/ide` or the OAuth callback returns a platform 404
- the callback loses PKCE state
- session refresh creates a login loop
- Free receives `bide.pro`, or Pro cannot retrieve it
- the service worker continues serving the prior application after refresh
