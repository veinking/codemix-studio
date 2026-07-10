# Stripe Setup — bIDE by CodeMix

## Sale/package status

No Stripe account, payment account, customer list, subscription revenue, or Stripe credentials are included with this starter SaaS package. The buyer must create and own all Stripe resources before enabling paid plans.

## How the current code is configured

Stripe is implemented through Supabase Edge Functions. Do **not** hardcode Stripe price IDs or secret keys in source code. The checkout function reads its configuration from Supabase Edge Function secrets:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`

The current `create-checkout` function returns a configuration error until `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID` are set in the buyer-owned Supabase project. Stripe webhook handling requires `STRIPE_WEBHOOK_SECRET`.

## Buyer setup checklist

1. Create a buyer-owned Stripe account.
2. Create a Stripe product for the paid bIDE plan, for example `bIDE Pro`.
3. Create a recurring Stripe price for that product.
4. Copy the Stripe price ID, which starts with `price_`.
5. Create a webhook endpoint pointing to the deployed Supabase `stripe-webhook` Edge Function URL.
6. Subscribe the webhook endpoint to checkout/subscription events used by the app, including checkout session completion and customer subscription updates/deletions.
7. Copy the webhook signing secret from Stripe.
8. Set Supabase Edge Function secrets in the buyer-owned Supabase project:

```bash
supabase secrets set STRIPE_SECRET_KEY=your-stripe-secret-key
supabase secrets set STRIPE_WEBHOOK_SECRET=your-stripe-webhook-signing-secret
supabase secrets set STRIPE_PRO_PRICE_ID=price_your_bide_pro_price
```

9. Deploy/redeploy the Stripe-related Supabase Edge Functions:

```bash
supabase functions deploy create-checkout
supabase functions deploy check-subscription
supabase functions deploy cancel-subscription
supabase functions deploy reactivate-subscription
supabase functions deploy sync-subscription
supabase functions deploy stripe-webhook
```

10. Test with Stripe test mode before production.

## Frontend test flow

After Supabase and Stripe are configured by the buyer:

1. Sign in with a test user.
2. Visit the upgrade/pricing flow.
3. Start checkout.
4. Complete Stripe test checkout with a Stripe test card.
5. Confirm the account/subscription page shows the paid tier.
6. Confirm the Stripe Dashboard shows the customer and subscription.
7. Confirm Supabase profile/subscription fields sync through the webhook or subscription sync function.

## Security notes

- Keep all Stripe secret values in Supabase Edge Function secrets, not Vite frontend env files.
- Do not commit `.env` or real Stripe credentials.
- Do not place `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or a production price ID directly in TypeScript source.
- Review Stripe tax, billing address, refund, cancellation, and legal policies before launch.
