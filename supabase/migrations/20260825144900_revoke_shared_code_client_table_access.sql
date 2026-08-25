-- The hardened client uses RPCs exclusively. Keep the backing table out of the
-- anon/authenticated Data API surface entirely; service-role/server operations
-- remain unaffected.
REVOKE ALL ON TABLE public.shared_code FROM anon;
REVOKE ALL ON TABLE public.shared_code FROM authenticated;
