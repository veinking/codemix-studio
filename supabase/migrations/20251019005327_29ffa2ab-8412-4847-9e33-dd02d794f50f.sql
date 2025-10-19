-- Ensure activity_stats table has a record to update
-- If no record exists, insert one
INSERT INTO public.activity_stats (total_code_runs, total_lines_executed, active_users_today)
SELECT 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.activity_stats LIMIT 1);

-- Update the increment_stats function to handle the case where no record exists
CREATE OR REPLACE FUNCTION public.increment_stats(code_runs integer, lines integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure at least one row exists
  INSERT INTO public.activity_stats (total_code_runs, total_lines_executed, active_users_today)
  SELECT 0, 0, 0
  WHERE NOT EXISTS (SELECT 1 FROM public.activity_stats LIMIT 1);
  
  -- Update the stats
  UPDATE public.activity_stats
  SET 
    total_code_runs = total_code_runs + code_runs,
    total_lines_executed = total_lines_executed + lines,
    active_users_today = active_users_today + 1,
    updated_at = now();
    
  -- Log the update for debugging
  RAISE NOTICE 'Stats updated: code_runs=%, lines=%', code_runs, lines;
END;
$function$;