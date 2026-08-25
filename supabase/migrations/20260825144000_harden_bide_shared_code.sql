-- Harden bIDE shared-code links so they are truly unlisted.
-- Public clients may fetch one exact share token through RPC, but may not list
-- the backing table. Share creation is authenticated, validated, and rate-limited.

-- Remove legacy policies that made every unexpired row directly queryable and
-- allowed direct client inserts.
DROP POLICY IF EXISTS "Anyone can view shared code" ON public.shared_code;
DROP POLICY IF EXISTS "Anyone can create shared code" ON public.shared_code;
DROP POLICY IF EXISTS shared_code_read ON public.shared_code;
DROP POLICY IF EXISTS shared_code_insert ON public.shared_code;
DROP POLICY IF EXISTS shared_code_read_own ON public.shared_code;

-- Signed-in owners may still inspect/delete their own rows. Public link reads
-- happen only through get_shared_code(text) below.
CREATE POLICY shared_code_read_own
ON public.shared_code
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Least-privilege table grants. Anonymous clients cannot touch shared_code
-- directly; authenticated clients cannot bypass RPC validation with INSERT or
-- mutate an existing share with UPDATE.
REVOKE ALL ON TABLE public.shared_code FROM anon;
REVOKE INSERT, UPDATE ON TABLE public.shared_code FROM authenticated;
GRANT SELECT, DELETE ON TABLE public.shared_code TO authenticated;

CREATE OR REPLACE FUNCTION public.create_shared_code(
  p_code text,
  p_language text,
  p_file_name text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_tags text[] DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_short_id text;
  v_recent_count integer;
  v_active_count integer;
  v_tag text;
  v_attempt integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Sign in to create a share link.';
  END IF;

  IF p_code IS NULL OR char_length(p_code) = 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Code cannot be empty.';
  END IF;

  IF char_length(p_code) > 200000 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Shared code is limited to 200,000 characters.';
  END IF;

  IF p_language IS NULL OR p_language NOT IN ('python', 'r', 'javascript', 'sql') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Unsupported share language.';
  END IF;

  IF p_file_name IS NOT NULL AND char_length(p_file_name) > 180 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'File name is too long.';
  END IF;

  IF p_category IS NULL OR p_category NOT IN (
    'data-analysis',
    'machine-learning',
    'visualization',
    'web-scraping',
    'utility',
    'education',
    'game',
    'other'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Select a valid share category.';
  END IF;

  IF p_description IS NULL
     OR char_length(btrim(p_description)) < 10
     OR char_length(btrim(p_description)) > 200 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Description must be 10 to 200 characters.';
  END IF;

  IF p_tags IS NOT NULL THEN
    IF cardinality(p_tags) > 5 THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'A share can have at most 5 tags.';
    END IF;

    FOREACH v_tag IN ARRAY p_tags LOOP
      IF v_tag IS NULL
         OR char_length(btrim(v_tag)) < 1
         OR char_length(btrim(v_tag)) > 30 THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Each tag must be 1 to 30 characters.';
      END IF;
    END LOOP;
  END IF;

  IF p_expires_at IS NOT NULL THEN
    IF p_expires_at <= pg_catalog.now() THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Share expiration must be in the future.';
    END IF;

    IF p_expires_at > pg_catalog.now() + interval '31 days' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Share expiration cannot exceed 31 days.';
    END IF;
  END IF;

  -- Keep a compromised or automated account from flooding the public share
  -- table. These are intentionally generous for normal interactive use.
  SELECT count(*)::integer
    INTO v_recent_count
    FROM public.shared_code
   WHERE user_id = v_user_id
     AND created_at > pg_catalog.now() - interval '10 minutes';

  IF v_recent_count >= 20 THEN
    RAISE EXCEPTION USING ERRCODE = '54000', MESSAGE = 'Too many share links created recently. Try again later.';
  END IF;

  SELECT count(*)::integer
    INTO v_active_count
    FROM public.shared_code
   WHERE user_id = v_user_id
     AND (expires_at IS NULL OR expires_at > pg_catalog.now());

  IF v_active_count >= 200 THEN
    RAISE EXCEPTION USING ERRCODE = '54000', MESSAGE = 'Active share-link limit reached. Delete an older share first.';
  END IF;

  -- 12 random bytes = 96 bits of entropy. Retry on the astronomically unlikely
  -- unique collision instead of exposing client-selected identifiers.
  FOR v_attempt IN 1..5 LOOP
    v_short_id := pg_catalog.encode(extensions.gen_random_bytes(12), 'hex');
    BEGIN
      INSERT INTO public.shared_code (
        user_id,
        short_id,
        code,
        language,
        file_name,
        expires_at,
        category,
        description,
        tags
      ) VALUES (
        v_user_id,
        v_short_id,
        p_code,
        p_language,
        NULLIF(btrim(p_file_name), ''),
        p_expires_at,
        p_category,
        btrim(p_description),
        CASE WHEN p_tags IS NULL THEN NULL ELSE ARRAY(
          SELECT lower(btrim(tag)) FROM unnest(p_tags) AS tag
        ) END
      );

      RETURN v_short_id;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt = 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  RAISE EXCEPTION 'Unable to allocate a share identifier.';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_shared_code(p_short_id text)
RETURNS TABLE (
  code text,
  language text,
  file_name text,
  created_at timestamptz,
  view_count integer,
  category text,
  description text,
  tags text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Fail closed without revealing whether malformed IDs resemble real rows.
  IF p_short_id IS NULL OR p_short_id !~ '^[0-9a-f]{24}$' THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.shared_code AS s
     SET view_count = s.view_count + 1
   WHERE s.short_id = p_short_id
     AND (s.expires_at IS NULL OR s.expires_at > pg_catalog.now())
  RETURNING
    s.code,
    s.language,
    s.file_name,
    s.created_at,
    s.view_count,
    s.category,
    s.description,
    s.tags;
END;
$$;

-- Functions in public can inherit broad default EXECUTE privileges on older
-- Supabase projects. Remove those defaults explicitly, then opt in only the
-- roles that need each RPC.
REVOKE ALL ON FUNCTION public.create_shared_code(text, text, text, timestamptz, text, text, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_shared_code(text, text, text, timestamptz, text, text, text[]) TO authenticated;

REVOKE ALL ON FUNCTION public.get_shared_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_code(text) TO anon, authenticated;

COMMENT ON FUNCTION public.create_shared_code(text, text, text, timestamptz, text, text, text[])
IS 'Creates a validated, authenticated bIDE unlisted code share and returns a server-generated 96-bit token.';

COMMENT ON FUNCTION public.get_shared_code(text)
IS 'Fetches exactly one unexpired bIDE share by secret token and atomically increments its view count.';
