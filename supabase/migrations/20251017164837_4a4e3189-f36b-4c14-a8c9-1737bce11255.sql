-- Phase 2: Activity Stats Table
-- Track aggregate usage statistics for social proof

CREATE TABLE IF NOT EXISTS public.activity_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_code_runs BIGINT NOT NULL DEFAULT 0,
  total_lines_executed BIGINT NOT NULL DEFAULT 0,
  active_users_today INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial row
INSERT INTO public.activity_stats (total_code_runs, total_lines_executed, active_users_today)
VALUES (0, 0, 0);

-- Enable RLS (public read-only access)
ALTER TABLE public.activity_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read stats (public data)
CREATE POLICY "Anyone can view activity stats"
ON public.activity_stats
FOR SELECT
USING (true);

-- Create table for recent activity feed (anonymized)
CREATE TABLE IF NOT EXISTS public.recent_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL, -- 'code_run', 'template_loaded', 'plot_created', etc.
  activity_description TEXT NOT NULL, -- e.g., "trained a neural network"
  language TEXT, -- 'python', 'r', 'javascript', 'sql'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for recent activity
ALTER TABLE public.recent_activity ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read recent activity (public feed)
CREATE POLICY "Anyone can view recent activity"
ON public.recent_activity
FOR SELECT
USING (true);

-- Create function to cleanup old activity entries (keep only last 100)
CREATE OR REPLACE FUNCTION public.cleanup_recent_activity()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.recent_activity
  WHERE id IN (
    SELECT id FROM public.recent_activity
    ORDER BY created_at DESC
    OFFSET 100
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-cleanup after inserts
CREATE TRIGGER trigger_cleanup_recent_activity
AFTER INSERT ON public.recent_activity
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_recent_activity();

-- Create index for faster queries
CREATE INDEX idx_recent_activity_created_at ON public.recent_activity(created_at DESC);
CREATE INDEX idx_recent_activity_type ON public.recent_activity(activity_type);