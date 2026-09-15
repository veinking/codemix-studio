# bIDE Phase 1 — Native Editor + Local Project Acceptance

## Automated build gate

- XcodeGen resolves Runestone and the pinned TreeSitterLanguages revision.
- Swift 6 strict-concurrency simulator build passes.
- Unsigned physical-device build targets arm64 iPhoneOS.
- Target supports iPhone + iPad.
- Phase 1 scope validator passes and blocks runtime/auth/billing scope leaks.

## Physical iPhone editor gate — PASSED

- tap-to-place caret works at beginning/middle/end of lines
- continuous typing has no observed jumps/dropped input
- native selection / Select All behaves correctly
- copy/cut/paste/undo/redo behave correctly
- quick coding toolbar pairs/symbols behave correctly
- keyboard dismissal works
- app tabs and editor controls remain fluid
- project/file switching and autosave behavior have not shown data loss

## Local project gate — PASSED / POLISHED

- starter project with `analysis.py`, `query.sql`, `model.R`
- project create/open/rename/delete
- visible project actions make Rename/Delete discoverable
- file create/open/rename/delete
- switching files saves the previous file
- autosave persists edits
- relaunch restores local work
- workspace title clearly identifies project while editor header identifies active file

## File ingress gate — PASSED ON DEVICE

- Import Project Folder accepts a Files folder and copies supported project contents locally
- standalone `.py`, `.sql`, and `.R` files are visible through Import Code Files
- one or multiple code files can create a new local project
- original external files are not edited in place
- Files → Open/Share in bIDE is registered for Python/SQL/R source types
- incoming supported source creates a local project copy and opens Workspace

## File egress gate — AUTOMATED GREEN, DEVICE SMOKE REMAINS

- the project file browser exposes a visible Export control
- Share File sends one `.py`, `.sql`, or `.R` file through the native iOS share sheet
- Export Project Files sends all current project source files through the native iOS share sheet
- pending edits are saved before the active file or project is shared
- Save to Files / AirDrop / other compatible iOS destinations receive normal source files rather than a proprietary format

## iPad gate

- persistent file rail appears at regular width
- switching through the rail preserves edits
- landscape provides materially more editor space
- hardware keyboard selection, Command-R and copy/paste are intended to remain functional

## Phase 1 scope gate

Do not include:

- Python execution
- SQL execution
- R execution
- WKWebView/Pyodide/webR
- StoreKit
- Supabase authentication
- cloud workspace sync
- PocketBI handoff
- arbitrary language expansion

## Exit

When the file-egress smoke test passes on device, Phase 1 is accepted. Phase 2 begins with one shared local Dataset/Asset registry plus native SQLite execution and structured results. Dataset imports and exports will extend the same iOS Files/Open-in-bIDE/share model to CSV, TSV, JSON, Excel, text, and later Parquet as practical.
