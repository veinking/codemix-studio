-- Create RPC function to increment activity stats
CREATE OR REPLACE FUNCTION public.increment_stats(code_runs INTEGER, lines INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.activity_stats
  SET 
    total_code_runs = total_code_runs + code_runs,
    total_lines_executed = total_lines_executed + lines,
    updated_at = now();
END;
$$;