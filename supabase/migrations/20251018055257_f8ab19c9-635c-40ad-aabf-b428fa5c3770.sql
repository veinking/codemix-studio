-- Create feedback type enum
CREATE TYPE public.feedback_type AS ENUM ('bug', 'feature', 'question', 'general');

-- Create feedback status enum
CREATE TYPE public.feedback_status AS ENUM ('new', 'in_progress', 'resolved');

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.feedback_type NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT,
  user_agent TEXT,
  page_context TEXT,
  status public.feedback_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT subject_length CHECK (length(subject) >= 3 AND length(subject) <= 200),
  CONSTRAINT message_length CHECK (length(message) >= 10 AND length(message) <= 2000)
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (anonymous allowed)
CREATE POLICY "Anyone can submit feedback"
ON public.feedback
FOR INSERT
WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX idx_feedback_status ON public.feedback(status);