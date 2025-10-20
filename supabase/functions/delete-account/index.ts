import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-ACCOUNT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user profile to check for Stripe subscription
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    // Cancel Stripe subscription if exists
    if (profile?.stripe_subscription_id) {
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
        
        try {
          await stripe.subscriptions.cancel(profile.stripe_subscription_id);
          logStep("Stripe subscription canceled", { subscriptionId: profile.stripe_subscription_id });
        } catch (stripeError) {
          logStep("Failed to cancel Stripe subscription", { error: stripeError });
          // Continue with deletion even if Stripe cancellation fails
        }
      }
    }

    // Delete user data from profiles table (CASCADE will handle related data)
    const { error: deleteProfileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (deleteProfileError) {
      logStep("Error deleting profile", { error: deleteProfileError });
      throw new Error('Failed to delete profile data');
    }

    // Delete the user from auth.users (this will cascade delete all related data)
    const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      logStep("Error deleting user", { error: deleteUserError });
      throw new Error('Failed to delete user account');
    }

    logStep("Account deleted successfully");

    return new Response(
      JSON.stringify({
        message: 'Account deleted successfully',
        success: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
