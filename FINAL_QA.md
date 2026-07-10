# Final QA — bIDE by CodeMix

## Package status

bIDE by CodeMix is prepared as a buyer-ready browser IDE starter SaaS package. It is not sold as a revenue-generating business.

## Commands run

| Command | Result | Notes |
|---|---|---|
| `npm install` | Pass | Dependencies installed from `package-lock.json`; npm warned about unknown env config `http-proxy`. |
| `npm audit --audit-level=low` | Warning | Registry audit endpoint returned HTTP 403 in this environment, so no vulnerability report was available to apply safe updates from. |
| `npm run lint` | Pass | ESLint completed successfully. |
| `npm run build` | Pass | Production build completed with documented browser data/sql.js externalization/large chunk warnings. |
| `timeout 8s npm run dev -- --host 127.0.0.1` | Pass | Vite dev server started at `http://127.0.0.1:8080/`; command ended via expected timeout after startup. |

## Remaining vulnerabilities

- `npm audit --audit-level=low` could not complete because the npm registry audit endpoint returned `403 Forbidden` from this environment.
- No automated audit vulnerability list was available; buyer should rerun `npm audit` in their own environment after transfer.
- No `npm audit fix --force` was used.

## Remaining warnings

- npm install emits an environment warning for unknown env config `http-proxy`.
- Production build may emit large chunk warnings due to Monaco, Pyodide/runtime adapters, sql.js-style browser IDE dependencies, docs pages, and data tools.
- Supabase, Stripe, and AI remain intentionally unconfigured until buyer supplies credentials.

## Known limitations / post-sale improvements

- Recommended future optimization: lazy-load Monaco, Pyodide/runtime adapters, docs pages, and data tools.
- Runtime behavior should be manually tested across target browsers and mobile devices after deployment.
- Backend auth/cloud/share/AI/payment features require buyer-owned Supabase, Stripe, and AI credentials.

## Buyer setup checklist

- [ ] Create buyer-owned Supabase project.
- [ ] Apply Supabase migrations.
- [ ] Deploy Supabase Edge Functions.
- [ ] Configure RLS policies and security review.
- [ ] Add Supabase frontend env vars.
- [ ] Configure OpenAI or buyer-selected AI gateway credentials.
- [ ] Create buyer-owned Stripe product and price.
- [ ] Configure Stripe webhook and Supabase Stripe secrets.
- [ ] Deploy frontend.
- [ ] Point `bideide.com` to frontend host.
- [ ] Redirect `codemixapp.com` if seller chooses to include/transfer it.
- [ ] Run full browser and mobile QA.

## Required buyer credentials

- Supabase project URL and anon/publishable key.
- Supabase service role key for Edge Functions only.
- OpenAI API key or buyer-selected AI gateway key for Edge Functions only.
- Stripe secret key, webhook secret, and Pro price ID.
- Deployment provider access.
- Domain registrar/DNS access for `bideide.com` and optionally `codemixapp.com`.

## Assets included

- Source code repository.
- Supabase migrations and Edge Functions.
- Public app icons, PWA manifest, Open Graph preview image, sitemap, and robots file.
- Buyer handoff/setup/QA documentation.
- `.env.example` with placeholder values only.

## Assets not included

- No customer database.
- No email list.
- No social media accounts unless separately transferred.
- No Stripe/payment account transfer.
- No Supabase project or credentials.
- No OpenAI/AI provider account or credentials.
- No private emails, tokens, or secrets.
- No `.env` file.
