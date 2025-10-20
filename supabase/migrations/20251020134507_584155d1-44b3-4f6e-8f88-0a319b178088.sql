-- Update AI usage limit function to check 5-day rolling window
CREATE OR REPLACE FUNCTION public.check_ai_usage_limit(p_user_id uuid DEFAULT NULL::uuid, p_guest_fingerprint text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tier TEXT;
  v_daily_limit INT;
  v_usage_count INT;
  v_can_use BOOLEAN;
  v_remaining INT;
BEGIN
  -- Determine tier and limit
  IF p_user_id IS NOT NULL THEN
    SELECT subscription_tier INTO v_tier
    FROM public.profiles
    WHERE id = p_user_id;
    
    IF v_tier = 'pro' THEN
      RETURN jsonb_build_object(
        'allowed', true,
        'tier', 'pro',
        'remaining', -1,
        'limit', -1,
        'message', 'Unlimited AI usage'
      );
    ELSE
      -- Free tier gets 3 requests per 5 days
      v_daily_limit := 3;
    END IF;
  ELSE
    -- Guests are completely blocked from AI features
    RETURN jsonb_build_object(
      'allowed', false,
      'tier', 'guest',
      'remaining', 0,
      'limit', 0,
      'message', 'AI features require a free account. Sign up to get 3 free AI requests every 5 days!'
    );
  END IF;
  
  -- Count usage in the last 5 days for authenticated users
  SELECT COUNT(*) INTO v_usage_count
  FROM public.ai_usage
  WHERE used_at >= CURRENT_DATE - INTERVAL '5 days'
    AND user_id = p_user_id;
  
  v_can_use := v_usage_count < v_daily_limit;
  v_remaining := GREATEST(0, v_daily_limit - v_usage_count);
  
  RETURN jsonb_build_object(
    'allowed', v_can_use,
    'tier', v_tier,
    'remaining', v_remaining,
    'limit', v_daily_limit,
    'used_today', v_usage_count,
    'message', CASE
      WHEN v_can_use THEN format('%s AI use remaining (resets every 5 days)', v_remaining)
      ELSE 'Daily limit reached (3/3). Upgrade to Pro for unlimited AI access!'
    END
  );
END;
$function$;