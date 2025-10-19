-- Create user profiles table with subscription tracking
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  subscription_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role has full access to profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create AI usage tracking table
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_fingerprint TEXT,
  feature_name TEXT NOT NULL,
  action_type TEXT,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  
  CONSTRAINT unique_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_fingerprint IS NULL) OR
    (user_id IS NULL AND guest_fingerprint IS NOT NULL)
  )
);

-- Indexes for fast queries
CREATE INDEX idx_ai_usage_user_date ON public.ai_usage(user_id, date);
CREATE INDEX idx_ai_usage_guest_date ON public.ai_usage(guest_fingerprint, date);

-- Enable RLS on ai_usage
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.ai_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages all usage"
  ON public.ai_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to check AI usage limits (all parameters have defaults)
CREATE OR REPLACE FUNCTION public.check_ai_usage_limit(
  p_user_id UUID DEFAULT NULL,
  p_guest_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      v_daily_limit := 6;
    END IF;
  ELSE
    v_tier := 'guest';
    v_daily_limit := 3;
  END IF;
  
  -- Count today's usage
  SELECT COUNT(*) INTO v_usage_today
  FROM public.ai_usage
  WHERE date = CURRENT_DATE
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_guest_fingerprint IS NOT NULL AND guest_fingerprint = p_guest_fingerprint)
    );
  
  v_can_use := v_usage_today < v_daily_limit;
  v_remaining := GREATEST(0, v_daily_limit - v_usage_today);
  
  RETURN jsonb_build_object(
    'allowed', v_can_use,
    'tier', v_tier,
    'remaining', v_remaining,
    'limit', v_daily_limit,
    'used_today', v_usage_today,
    'message', CASE
      WHEN v_can_use THEN format('%s AI uses remaining today', v_remaining)
      ELSE format('Daily limit reached (%s/%s). Upgrade for unlimited access!', v_usage_today, v_daily_limit)
    END
  );
END;
$$;

-- Function to record AI usage (required param first, then defaults)
CREATE OR REPLACE FUNCTION public.record_ai_usage(
  p_feature_name TEXT,
  p_user_id UUID DEFAULT NULL,
  p_guest_fingerprint TEXT DEFAULT NULL,
  p_action_type TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_usage (user_id, guest_fingerprint, feature_name, action_type)
  VALUES (p_user_id, p_guest_fingerprint, p_feature_name, p_action_type);
END;
$$;

-- Update recent_activity to support auth users
ALTER TABLE public.recent_activity 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- Update RLS for recent_activity
DROP POLICY IF EXISTS "Anyone can view recent activity" ON public.recent_activity;

CREATE POLICY "Users can view own or guest activity"
  ON public.recent_activity FOR SELECT
  USING (user_id = auth.uid() OR is_guest = true OR user_id IS NULL);

CREATE POLICY "Service role can manage activity"
  ON public.recent_activity FOR ALL
  USING (true)
  WITH CHECK (true);