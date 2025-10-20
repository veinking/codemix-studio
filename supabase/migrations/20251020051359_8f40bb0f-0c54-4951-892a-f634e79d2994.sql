-- Fix activity tracking for both authenticated and guest users

-- Drop and recreate the add_recent_activity function to handle guests
CREATE OR REPLACE FUNCTION public.add_recent_activity(
  activity_type text,
  activity_description text,
  language text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert activity with proper user tracking
  INSERT INTO public.recent_activity (
    activity_type,
    activity_description,
    language,
    user_id,
    is_guest
  )
  VALUES (
    activity_type,
    activity_description,
    language,
    auth.uid(), -- Will be NULL for guests
    CASE WHEN auth.uid() IS NULL THEN true ELSE false END
  );
  
  RAISE NOTICE 'Activity added: type=%, user=%, guest=%', 
    activity_type, 
    COALESCE(auth.uid()::text, 'guest'),
    (auth.uid() IS NULL);
END;
$$;

-- Update RLS policy to allow guest inserts
DROP POLICY IF EXISTS "Allow guest activity tracking" ON public.recent_activity;
CREATE POLICY "Allow guest activity tracking"
  ON public.recent_activity
  FOR INSERT
  WITH CHECK (
    -- Allow if user is authenticated and matches
    (auth.uid() = user_id)
    OR
    -- Allow if it's a guest activity (no user_id and is_guest = true)
    (user_id IS NULL AND is_guest = true)
  );

-- Ensure activity_stats table has proper permissions
ALTER TABLE public.activity_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role full access to stats" ON public.activity_stats;

-- Create policy for updating stats (anyone can update via the function)
CREATE POLICY "Allow function to update stats"
  ON public.activity_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);