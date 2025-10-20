import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err: any) {
    console.error('[STRIPE-WEBHOOK] Webhook signature verification failed:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400 }
    );
  }

  console.log('[STRIPE-WEBHOOK] Received event:', event.type);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId) {
          console.error('[STRIPE-WEBHOOK] No user_id in session metadata');
          break;
        }

        console.log('[STRIPE-WEBHOOK] Checkout completed for user:', userId);

        await supabase.from('profiles').update({
          subscription_tier: 'pro',
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_period_end: session.expires_at
            ? new Date(session.expires_at * 1000).toISOString()
            : null,
        }).eq('id', userId);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('[STRIPE-WEBHOOK] Subscription updated:', subscription.id);

        // Find user by customer ID
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (!profiles || profiles.length === 0) {
          console.error('[STRIPE-WEBHOOK] No user found for customer:', customerId);
          break;
        }

        await supabase.from('profiles').update({
          subscription_status: subscription.status,
          subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('id', profiles[0].id);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('[STRIPE-WEBHOOK] Subscription deleted:', subscription.id);

        // Find user by customer ID
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (!profiles || profiles.length === 0) {
          console.error('[STRIPE-WEBHOOK] No user found for customer:', customerId);
          break;
        }

        await supabase.from('profiles').update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          cancel_at_period_end: false,
          canceled_at: null,
          stripe_subscription_id: null,
        }).eq('id', profiles[0].id);

        break;
      }

      default:
        console.log('[STRIPE-WEBHOOK] Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('[STRIPE-WEBHOOK] Error processing event:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
