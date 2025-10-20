-- Create workspaces table for cloud sync
CREATE TABLE public.workspaces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  active_file_id text,
  language text NOT NULL DEFAULT 'python',
  last_accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Users can view their own workspaces
CREATE POLICY "Users can view their own workspaces"
ON public.workspaces
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own workspaces
CREATE POLICY "Users can create their own workspaces"
ON public.workspaces
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own workspaces
CREATE POLICY "Users can update their own workspaces"
ON public.workspaces
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own workspaces
CREATE POLICY "Users can delete their own workspaces"
ON public.workspaces
FOR DELETE
USING (auth.uid() = user_id);

-- Create community recipes table
CREATE TABLE public.community_recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  language text NOT NULL,
  code text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  difficulty text NOT NULL DEFAULT 'beginner',
  likes_count integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for recipes
ALTER TABLE public.community_recipes ENABLE ROW LEVEL SECURITY;

-- Anyone can view public recipes
CREATE POLICY "Anyone can view public recipes"
ON public.community_recipes
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- Users can create their own recipes
CREATE POLICY "Users can create their own recipes"
ON public.community_recipes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own recipes
CREATE POLICY "Users can update their own recipes"
ON public.community_recipes
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own recipes
CREATE POLICY "Users can delete their own recipes"
ON public.community_recipes
FOR DELETE
USING (auth.uid() = user_id);

-- Create recipe likes table
CREATE TABLE public.recipe_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid NOT NULL REFERENCES public.community_recipes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(recipe_id, user_id)
);

-- Enable RLS for recipe likes
ALTER TABLE public.recipe_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes
CREATE POLICY "Users can view all likes"
ON public.recipe_likes
FOR SELECT
USING (true);

-- Users can create their own likes
CREATE POLICY "Users can create their own likes"
ON public.recipe_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
ON public.recipe_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update workspace timestamp
CREATE OR REPLACE FUNCTION public.update_workspace_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for workspace updates
CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_workspace_timestamp();

-- Create function to update recipe likes count
CREATE OR REPLACE FUNCTION public.update_recipe_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_recipes
    SET likes_count = likes_count + 1
    WHERE id = NEW.recipe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_recipes
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.recipe_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for recipe likes
CREATE TRIGGER update_recipe_likes_count_trigger
AFTER INSERT OR DELETE ON public.recipe_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_recipe_likes_count();

-- Create indexes for performance
CREATE INDEX idx_workspaces_user_id ON public.workspaces(user_id);
CREATE INDEX idx_workspaces_last_accessed ON public.workspaces(last_accessed_at DESC);
CREATE INDEX idx_community_recipes_user_id ON public.community_recipes(user_id);
CREATE INDEX idx_community_recipes_public ON public.community_recipes(is_public) WHERE is_public = true;
CREATE INDEX idx_community_recipes_category ON public.community_recipes(category);
CREATE INDEX idx_community_recipes_language ON public.community_recipes(language);
CREATE INDEX idx_recipe_likes_recipe_id ON public.recipe_likes(recipe_id);
CREATE INDEX idx_recipe_likes_user_id ON public.recipe_likes(user_id);