-- Clean up orphaned recent_activity records with NULL user_id
DELETE FROM public.recent_activity WHERE user_id IS NULL;

-- Ensure profiles table explicitly blocks anonymous access
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

CREATE POLICY "Block anonymous access to profiles"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (false);

-- Add service role policy for managing recent_activity (including guest sessions)
CREATE POLICY "Service role can manage all activity"
  ON public.recent_activity
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);