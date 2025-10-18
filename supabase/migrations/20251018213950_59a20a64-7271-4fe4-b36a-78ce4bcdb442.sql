-- Realtime for recent activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE recent_activity;

-- Function to add recent activity with SECURITY DEFINER so it bypasses RLS
CREATE OR REPLACE FUNCTION public.add_recent_activity(activity_type text, activity_description text, language text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.recent_activity (activity_type, activity_description, language)
  VALUES (activity_type, activity_description, language);
END;
$$;

-- Ensure clients can call the functions
GRANT EXECUTE ON FUNCTION public.add_recent_activity(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_stats(integer, integer) TO anon, authenticated;

-- Keep recent_activity to last 100 entries automatically
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'cleanup_recent_activity_trigger'
  ) THEN
    CREATE TRIGGER cleanup_recent_activity_trigger
    AFTER INSERT ON public.recent_activity
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.cleanup_recent_activity();
  END IF;
END;
$$;