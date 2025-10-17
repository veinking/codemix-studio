-- Create shared_code table for storing shared code snippets
CREATE TABLE public.shared_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0 NOT NULL
);

-- Enable RLS
ALTER TABLE public.shared_code ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can view shared code)
CREATE POLICY "Anyone can view shared code"
ON public.shared_code
FOR SELECT
USING (
  expires_at IS NULL OR expires_at > now()
);

-- Users can create shared code (authenticated or anonymous)
CREATE POLICY "Anyone can create shared code"
ON public.shared_code
FOR INSERT
WITH CHECK (true);

-- Users can update their own shared code
CREATE POLICY "Users can update their own shared code"
ON public.shared_code
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own shared code
CREATE POLICY "Users can delete their own shared code"
ON public.shared_code
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for fast lookups by short_id
CREATE INDEX idx_shared_code_short_id ON public.shared_code(short_id);

-- Create index for cleanup of expired shares
CREATE INDEX idx_shared_code_expires_at ON public.shared_code(expires_at) WHERE expires_at IS NOT NULL;