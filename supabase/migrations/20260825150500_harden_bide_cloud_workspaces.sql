-- Make bIDE cloud workspaces complete enough to restore a solo coding session
-- and bound row growth before users begin storing snapshots here.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS scratch_code text NOT NULL DEFAULT '';

ALTER TABLE public.workspaces
  DROP CONSTRAINT IF EXISTS workspaces_name_length_check,
  DROP CONSTRAINT IF EXISTS workspaces_description_length_check,
  DROP CONSTRAINT IF EXISTS workspaces_language_check,
  DROP CONSTRAINT IF EXISTS workspaces_files_array_check,
  DROP CONSTRAINT IF EXISTS workspaces_files_count_check,
  DROP CONSTRAINT IF EXISTS workspaces_files_size_check,
  DROP CONSTRAINT IF EXISTS workspaces_scratch_size_check;

ALTER TABLE public.workspaces
  ADD CONSTRAINT workspaces_name_length_check
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  ADD CONSTRAINT workspaces_description_length_check
    CHECK (description IS NULL OR char_length(description) <= 500),
  ADD CONSTRAINT workspaces_language_check
    CHECK (language IN ('python', 'r', 'javascript', 'sql')),
  ADD CONSTRAINT workspaces_files_array_check
    CHECK (jsonb_typeof(files) = 'array'),
  ADD CONSTRAINT workspaces_files_count_check
    CHECK (jsonb_array_length(files) <= 100),
  ADD CONSTRAINT workspaces_files_size_check
    CHECK (octet_length(files::text) <= 5242880),
  ADD CONSTRAINT workspaces_scratch_size_check
    CHECK (octet_length(scratch_code) <= 1048576);

COMMENT ON COLUMN public.workspaces.scratch_code
IS 'Unsaved bIDE scratch-editor buffer included in the cloud workspace snapshot.';
