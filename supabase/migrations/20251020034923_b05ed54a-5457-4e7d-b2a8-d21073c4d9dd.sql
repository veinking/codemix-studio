-- Critical Security Fix 1: Restrict feedback table access to service role only
-- Revoke public SELECT access from feedback table
REVOKE SELECT ON public.feedback FROM anon, authenticated;

-- Only service role (backend functions) can view feedback
CREATE POLICY "Service role only can view feedback"
  ON public.feedback
  FOR SELECT
  TO service_role
  USING (true);

-- Critical Security Fix 2: Add missing RLS policies to recent_activity table
-- Only service role can INSERT activity logs
CREATE POLICY "Service role can insert activity"
  ON public.recent_activity
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only service role can UPDATE activity logs
CREATE POLICY "Service role can update activity"
  ON public.recent_activity
  FOR UPDATE
  TO service_role
  USING (true);

-- Only service role can DELETE activity logs
CREATE POLICY "Service role can delete activity"
  ON public.recent_activity
  FOR DELETE
  TO service_role
  USING (true);