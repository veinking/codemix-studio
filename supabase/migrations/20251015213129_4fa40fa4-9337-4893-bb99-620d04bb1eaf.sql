-- Create labs_progress table
CREATE TABLE public.labs_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  completed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, difficulty)
);

-- Create labs_history table
CREATE TABLE public.labs_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lab_title TEXT NOT NULL,
  lab_theme TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  lab_content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed BOOLEAN NOT NULL DEFAULT false,
  test_passed BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.labs_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labs_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for labs_progress
CREATE POLICY "Users can view their own progress"
  ON public.labs_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.labs_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.labs_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for labs_history
CREATE POLICY "Users can view their own history"
  ON public.labs_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON public.labs_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history"
  ON public.labs_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
  ON public.labs_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_labs_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_labs_progress_updated_at
  BEFORE UPDATE ON public.labs_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_labs_progress_updated_at();