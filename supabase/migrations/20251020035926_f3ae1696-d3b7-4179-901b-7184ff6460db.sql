-- Explicitly deny anonymous/public access to profiles table
-- This prevents data harvesting and protects sensitive customer information
CREATE POLICY "Block anonymous access to profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (false);