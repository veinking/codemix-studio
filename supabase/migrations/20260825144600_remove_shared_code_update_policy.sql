-- Direct share mutation is not part of the public client contract. The table
-- no longer grants UPDATE to anon/authenticated, so remove the stale policy too.
DROP POLICY IF EXISTS shared_code_update_own ON public.shared_code;
