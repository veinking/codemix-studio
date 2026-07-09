# Backend Setup — Supabase for bIDE by CodeMix

## Backend status

The included backend is **buyer-configurable**. This sale package includes Supabase migrations and Edge Functions, but no live Supabase project credentials. The old project ref was removed from the app and `supabase/config.toml` now uses `your-project-ref`.

## Supabase setup

1. Create a new Supabase project owned by the buyer.
2. Install the Supabase CLI.
3. Link the project:

```bash
supabase link --project-ref your-project-ref
```

4. Apply database migrations:

```bash
supabase db push
```

5. Deploy functions:

```bash
supabase functions deploy ai-code-assistant
supabase functions deploy code-translator
supabase functions deploy data-advisor
supabase functions deploy lab-trainer
supabase functions deploy explain-error
supabase functions deploy create-checkout
supabase functions deploy check-subscription
supabase functions deploy cancel-subscription
supabase functions deploy reactivate-subscription
supabase functions deploy delete-account
supabase functions deploy sync-subscription
supabase functions deploy stripe-webhook
```

## Required Supabase secrets

Set secrets in Supabase, not in frontend `.env` files:

```bash
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set OPENAI_API_KEY=your-openai-key
supabase secrets set LOVABLE_API_KEY=your-ai-gateway-key-if-used
supabase secrets set STRIPE_SECRET_KEY=your-stripe-secret-key
supabase secrets set STRIPE_WEBHOOK_SECRET=your-webhook-secret
supabase secrets set STRIPE_PRO_PRICE_ID=price_...
```

## RLS and security notes

- Treat all workspace, profile, feedback, activity, recipe, lab, and share data as user-owned.
- Review every migration in `supabase/migrations` before production.
- Confirm RLS is enabled for user-owned tables.
- Policies should scope rows by `auth.uid()` or intentionally public share IDs.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, Stripe secret keys, webhook secrets, or AI provider keys to the Vite frontend.

## Missing config behavior

The frontend detects missing Supabase env values and continues in offline/local mode. Auth, cloud sync, AI function calls, and payments show errors or disabled behavior instead of crashing.
