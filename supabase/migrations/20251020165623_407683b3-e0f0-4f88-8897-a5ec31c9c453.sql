-- Fix increment_stats function to avoid read-only transaction errors
-- The existing function tries to INSERT even when a row exists, causing failures
CREATE OR REPLACE FUNCTION public.increment_stats(code_runs integer, lines integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple UPDATE since we know a row exists (created in initial migration)
  -- If somehow no row exists, this will silently do nothing
  UPDATE public.activity_stats
  SET 
    total_code_runs = GREATEST(0, total_code_runs + code_runs),
    total_lines_executed = GREATEST(0, total_lines_executed + lines),
    active_users_today = GREATEST(0, active_users_today + 1),
    updated_at = now()
  WHERE id IS NOT NULL;
  
  -- Ensure we have at least one row for future calls
  -- Use INSERT ... ON CONFLICT DO NOTHING to avoid errors
  INSERT INTO public.activity_stats (total_code_runs, total_lines_executed, active_users_today)
  VALUES (0, 0, 0)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_stats(integer, integer) TO anon, authenticated;