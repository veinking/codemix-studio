# bIDE Native Device Testing

## Installable checkpoint

1. Use the latest successful `bIDE iOS Quality` artifact for the exact head being tested.
2. The artifact contains `bIDE-Sideloadly.ipa` plus packaging logs.
3. CI verifies iPhoneOS, arm64, iPhone + iPad device family support, unsigned packaging, and IPA integrity.
4. Use the same local Sideloadly flow used for internal builds. Sideloadly performs the temporary local signing step.
5. Do not add App Store provisioning, StoreKit, Supabase production credentials, or runtime credentials for this Phase 1 test.

## Core smoke test

On a physical iPhone:

- launch bIDE with no sign-in
- confirm Workspace opens to the latest local project/file
- confirm the software keyboard can be dismissed with the toolbar button and by dragging down
- confirm cursor placement, selection, copy/paste, quick coding keys, find/replace, and autosave remain usable
- confirm project/file edits survive backgrounding and relaunch

## Project management smoke test

- create and rename a disposable project
- use the visible project actions menu to delete it
- confirm swipe Rename/Delete actions are discoverable
- confirm the workspace navigation title shows the project name while the editor header identifies the active file

## File ingress smoke test

### Import Project Folder

From Projects → Import → **Import Project Folder**:

- choose a small Files folder containing `.py`, `.sql`, and/or `.R` source
- confirm the folder becomes a local bIDE project
- confirm supported source files appear in the project file browser
- confirm the original Files folder remains untouched

### Import Code Files

From Projects → Import → **Import Code Files**:

- confirm `.py`, `.sql`, and `.R` files are visible/selectable in the Files picker
- import one standalone file and confirm a new local project opens with that file
- import multiple supported code files and confirm all selected files appear in the created project
- confirm the original source files remain untouched

### Open / Share in bIDE

From the iOS Files app:

- choose a `.py`, `.sql`, or `.R` source file
- use Open/Share and choose bIDE when offered by iOS
- confirm bIDE launches, creates a local project copy, opens Workspace, and shows the imported source
- confirm edits in bIDE do not mutate the original external file

If iOS does not offer bIDE for a supported source extension, record the extension, Files provider/location, iOS version, and whether the same file is visible through bIDE's own Import Code Files picker.

## Full Phase 1 acceptance

Use `ios/PHASE_1_EDITOR_ACCEPTANCE.md` for the complete editor/project acceptance matrix.

When reporting a device issue, include:

- device + iOS version
- portrait/landscape
- language/file type
- hardware keyboard attached or not
- exact reproduction steps
- expected behavior
- actual behavior
- whether relaunch changes the behavior

A short screen recording is ideal for interaction bugs.

## Phase boundary

Phase 1 remains local and standalone. Do not add Python/R runtimes, SQL execution, authentication, billing, cloud workspace sync, or PocketBI handoff until the native editor/project/file-ingress gate is accepted. Phase 2 begins with a shared local Dataset/Asset model plus native SQLite execution so CSV/Excel/data imports can serve SQL first and Python later without duplicate import systems.
