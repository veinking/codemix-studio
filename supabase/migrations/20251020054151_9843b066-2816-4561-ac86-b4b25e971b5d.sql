-- Update check_ai_usage_limit to block guests and set free tier to 1/day
CREATE OR REPLACE FUNCTION public.check_ai_usage_limit(p_user_id uuid DEFAULT NULL::uuid, p_guest_fingerprint text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tier TEXT;
  v_daily_limit INT;
  v_usage_today INT;
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
      -- Free tier gets 1 request per day (reduced from 6)
      v_daily_limit := 1;
    END IF;
  ELSE
    -- Guests are completely blocked from AI features
    RETURN jsonb_build_object(
      'allowed', false,
      'tier', 'guest',
      'remaining', 0,
      'limit', 0,
      'message', 'AI features require a free account. Sign up to get 1 free AI request per day!'
    );
  END IF;
  
  -- Count today's usage for authenticated users
  SELECT COUNT(*) INTO v_usage_today
  FROM public.ai_usage
  WHERE date = CURRENT_DATE
    AND user_id = p_user_id;
  
  v_can_use := v_usage_today < v_daily_limit;
  v_remaining := GREATEST(0, v_daily_limit - v_usage_today);
  
  RETURN jsonb_build_object(
    'allowed', v_can_use,
    'tier', v_tier,
    'remaining', v_remaining,
    'limit', v_daily_limit,
    'used_today', v_usage_today,
    'message', CASE
      WHEN v_can_use THEN format('%s AI use remaining today', v_remaining)
      ELSE format('Daily limit reached (1/1). Upgrade to Pro for unlimited AI access!')
    END
  );
END;
$function$;