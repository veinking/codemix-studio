# bIDE Phase 1 — Native Editor + Local Project Acceptance

## Automated build gate

- XcodeGen resolves Runestone and the pinned TreeSitterLanguages revision.
- Swift 6 strict-concurrency simulator build passes.
- Unsigned physical-device build targets arm64 iPhoneOS.
- Target supports iPhone + iPad.
- Phase 1 scope validator passes and blocks runtime/auth/billing scope leaks.

## Physical iPhone editor gate

- tap-to-place caret works at beginning/middle/end of lines
- continuous typing for 30 seconds has no jumps/dropped input
- native long-press selection handles behave correctly
- copy/cut/paste/undo/redo behave correctly
- multiline paste keeps usable indentation
- Tab/outdent preserve insertion point and multiline selection
- quick coding toolbar pairs/symbols behave correctly
- caret arrows move predictably
- completion chips replace the intended token
- Find Next / Replace Next / Replace All behave correctly
- Command-R / Run reaches the editor execution boundary without running a runtime
- repeated keyboard open/close preserves file and selection state
- portrait/landscape preserves project/file/editor state

## Local project gate

- first launch creates a starter project with `analysis.py`, `query.sql`, `model.R`
- project create/open/rename/delete works
- visible project actions make Rename/Delete discoverable
- file create/open/rename/delete works
- switching files saves the previous file
- autosave persists edits
- backgrounding saves active work
- relaunch restores the last project/file
- save failure surfaces an error state
- workspace title clearly identifies project while editor header identifies active file

## File ingress gate

- Import Project Folder accepts a Files folder and copies supported project contents locally
- standalone `.py`, `.sql`, and `.R` files are visible through Import Code Files
- one or multiple code files can create a new local project
- original external files are not edited in place
- Files → Open/Share in bIDE is registered for Python/SQL/R source types
- incoming supported source creates a local project copy and opens Workspace

## iPad gate

- persistent file rail appears at regular width
- switching through the rail preserves edits
- landscape provides materially more editor space
- hardware keyboard selection, Command-R and copy/paste work

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

When the editor/project/file-ingress gates pass on device, Phase 1 is accepted. Phase 2 begins with one shared local Dataset/Asset registry plus native SQLite execution and structured results. Dataset imports will then extend the same iOS Files/Open-in-bIDE ingress model to CSV, TSV, JSON, Excel, text, and later Parquet as practical.
