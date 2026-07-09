# Final QA — bIDE by CodeMix

## Commands run

| Command | Result | Notes |
|---|---|---|
| `npm install` | Pass | Dependencies installed from lockfile. NPM emitted an environment warning about `http-proxy`. |
| `npm run build` | Pass | Production build completed. Vite warned about large chunks and stale browser data. |
| `npm run lint` | Pass | ESLint completed successfully. |
| `npm run dev -- --host 127.0.0.1` | Pass | Dev server started on the configured Vite port `8080` and returned HTTP 200. |
| `npm run preview -- --host 127.0.0.1` | Pass | Preview server started on port `4173` and returned HTTP 200. |

## Product flow audit

- Landing page: builds and is routed through the React app.
- Login/signup: present through Supabase auth; requires buyer Supabase config.
- Dashboard/workspace/IDE: present at the IDE route with editor components and runtime adapters.
- Code editor: Monaco-based editor components are included.
- Language selection: language selector/data exists for supported languages.
- Running code: runtime adapter architecture is included; browser runtime QA should be repeated after deployment.
- Saving projects/files: local storage and Supabase cloud workspace hooks exist; cloud saving requires Supabase.
- AI coding tools: Edge Function client flow exists; disabled/fails gracefully without Supabase/AI credentials.
- Data science/CSV tools: data lab, dataset viewer, plot builder, and data operation components exist.
- Docs/learning pages: docs, tutorials, use cases, blog/comparison pages exist.
- Pricing/payment pages: upgrade/account/subscription flows exist; live checkout disabled until Stripe env is configured.
- Mobile layout: dedicated mobile layout/hooks exist; buyer should perform device QA before launch.

## Remaining warnings/errors

- Build chunk-size warning: recommend code splitting post-sale.
- Browserslist/baseline data warning: can be refreshed with dependency maintenance.
- Supabase, Stripe, and AI remain intentionally unconfigured.

## Buyer setup checklist

- [ ] Create Supabase project.
- [ ] Apply migrations.
- [ ] Deploy Edge Functions.
- [ ] Configure RLS policies and security review.
- [ ] Add Supabase frontend env vars.
- [ ] Configure AI provider/gateway credentials.
- [ ] Create Stripe product and price.
- [ ] Configure Stripe webhook and secrets.
- [ ] Deploy frontend.
- [ ] Point `bideide.com` to frontend host.
- [ ] Redirect `codemixapp.com` if included.
- [ ] Run full browser and mobile QA.

## Required buyer credentials

- Supabase project URL and anon key.
- Supabase service role key for Edge Functions only.
- AI provider key/gateway key for Edge Functions only.
- Stripe secret key, webhook secret, and Pro price ID.
- Deployment provider access.
- Domain registrar/DNS access for bideide.com and optionally codemixapp.com.

## Known limitations

This is a starter SaaS package, not a fully operated live business. It does not include seller-owned credentials, payment accounts, private emails, or API keys.
