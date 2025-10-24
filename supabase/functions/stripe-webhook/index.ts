import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@18.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Validate environment variables
  const requiredEnvVars = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredEnvVars.filter(v => !Deno.env.get(v));
  if (missing.length > 0) {
    console.error('[STRIPE-WEBHOOK] Missing env vars:', missing);
    return new Response(
      JSON.stringify({ error: `Missing environment variables: ${missing.join(', ')}` }),
      { status: 500, headers: corsHeaders }
    );
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2025-08-27.basil',
  });

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err: any) {
    console.error('[STRIPE-WEBHOOK] Webhook signature verification failed:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: corsHeaders }
    );
  }

  console.log('[STRIPE-WEBHOOK] Received event:', event.type);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId) {
          console.error('[STRIPE-WEBHOOK] No user_id in session metadata');
          return new Response(
            JSON.stringify({ error: 'Missing user_id in metadata' }),
            { status: 400, headers: corsHeaders }
          );
        }

        console.log('[STRIPE-WEBHOOK] Checkout completed for user:', userId);

        const { error: updateError } = await supabase.from('profiles').update({
          subscription_tier: 'pro',
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_period_end: session.expires_at
            ? new Date(session.expires_at * 1000).toISOString()
            : null,
        }).eq('id', userId);

        if (updateError) {
          console.error('[STRIPE-WEBHOOK] Database update failed:', updateError);
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('[STRIPE-WEBHOOK] Subscription updated:', subscription.id);

        // Find user by customer ID
        const { data: profiles, error: selectError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (selectError) {
          console.error('[STRIPE-WEBHOOK] Database query failed:', selectError);
          throw new Error(`Database query failed: ${selectError.message}`);
        }

        if (!profiles || profiles.length === 0) {
          console.error('[STRIPE-WEBHOOK] No user found for customer:', customerId);
          return new Response(
            JSON.stringify({ error: 'No user found for customer' }),
            { status: 404, headers: corsHeaders }
          );
        }

        const { error: updateError } = await supabase.from('profiles').update({
          subscription_status: subscription.status,
          subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('id', profiles[0].id);

        if (updateError) {
          console.error('[STRIPE-WEBHOOK] Database update failed:', updateError);
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('[STRIPE-WEBHOOK] Subscription deleted:', subscription.id);

        // Find user by customer ID
        const { data: profiles, error: selectError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (selectError) {
          console.error('[STRIPE-WEBHOOK] Database query failed:', selectError);
          throw new Error(`Database query failed: ${selectError.message}`);
        }

        if (!profiles || profiles.length === 0) {
          console.error('[STRIPE-WEBHOOK] No user found for customer:', customerId);
          return new Response(
            JSON.stringify({ error: 'No user found for customer' }),
            { status: 404, headers: corsHeaders }
          );
        }

        const { error: updateError } = await supabase.from('profiles').update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          cancel_at_period_end: false,
          canceled_at: null,
          stripe_subscription_id: null,
        }).eq('id', profiles[0].id);

        if (updateError) {
          console.error('[STRIPE-WEBHOOK] Database update failed:', updateError);
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        break;
      }

      default:
        console.log('[STRIPE-WEBHOOK] Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error: any) {
    console.error('[STRIPE-WEBHOOK] Error processing event:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
