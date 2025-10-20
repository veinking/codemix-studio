# Stripe Setup Instructions

Your subscription system is ready! Follow these steps to complete the Stripe configuration:

## 1. Create the Pro Plan in Stripe Dashboard

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Products** → **Add product**
3. Create a new product with these details:
   - **Name**: OpenIDE Pro
   - **Description**: Unlimited AI-powered code assistance, extended code sharing, and priority support
   - **Pricing**: $9.99 USD / month (recurring)
   - Set as a **Recurring subscription**
4. Click **Save product**
5. **Copy the Price ID** (starts with `price_...`)

## 2. Update the Price ID in Code

1. Open `supabase/functions/create-checkout/index.ts`
2. Find line 55: `const priceId = 'price_PLACEHOLDER';`
3. Replace `'price_PLACEHOLDER'` with your actual price ID from Stripe
4. Save the file

Example:
```typescript
const priceId = 'price_1234567890abcdef'; // Your actual Stripe price ID
```

## 3. Test the Subscription Flow

1. Go to `/upgrade` page
2. Click "Upgrade Now" button
3. Complete test checkout (use Stripe test card: `4242 4242 4242 4242`)
4. Verify subscription appears in your Stripe dashboard
5. Check that your account page shows "Pro" tier

## 4. Features Implemented

✅ Guest prompt in IDE (subtle, dismissible)
✅ Free account creation flow
✅ Stripe checkout integration
✅ Subscription status checking
✅ Profile tier management
✅ AI usage limits (Guest: 3/day, Free: 6/day, Pro: unlimited)

## 5. Verify Subscription System

The check-subscription function runs automatically to:
- Detect active Stripe subscriptions
- Update user profiles with tier info
- Sync subscription status

Test by:
1. Creating a test subscription
2. Going to `/account` page
3. Verifying "Pro" badge appears
4. Checking AI usage indicator shows "Unlimited"

## Notes

- The guest prompt appears once per session for non-logged-in users
- Dismissing it stores the preference in localStorage
- Upgrade page works for both guests (redirects to signup) and logged-in users
- Subscription status updates automatically when users log in

Need help? The subscription system is fully configured and ready once you add the real Stripe price ID!
