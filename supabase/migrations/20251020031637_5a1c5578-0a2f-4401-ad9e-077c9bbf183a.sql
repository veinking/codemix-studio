-- Add canceled_at timestamp to track when user canceled
ALTER TABLE public.profiles 
ADD COLUMN canceled_at timestamp with time zone;