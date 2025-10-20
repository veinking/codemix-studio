-- Fix profiles table RLS policies to prevent public access
-- Drop the overly permissive service role policy that allows public access
DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;

-- Create a proper service role policy that only works for service role, not public
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix recent_activity table to only allow users to view their own authenticated activity
DROP POLICY IF EXISTS "Users can view own or guest activity" ON public.recent_activity;

CREATE POLICY "Users can view their own activity only"
  ON public.recent_activity
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own activity
CREATE POLICY "Users can insert their own activity"
  ON public.recent_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);