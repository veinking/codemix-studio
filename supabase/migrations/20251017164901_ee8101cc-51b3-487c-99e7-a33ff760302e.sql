-- Fix security warning: Set search_path for cleanup_recent_activity function
CREATE OR REPLACE FUNCTION public.cleanup_recent_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.recent_activity
  WHERE id IN (
    SELECT id FROM public.recent_activity
    ORDER BY created_at DESC
    OFFSET 100
  );
  RETURN NULL;
END;
$$;