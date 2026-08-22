# bIDE iOS Phase 1 Editor Acceptance

Phase 1 is the native editor + local project core only. Runtime execution, PocketBI ID, StoreKit, cloud sync, and ecosystem handoffs are out of scope until this gate passes.

## Build gate

- XcodeGen resolves Runestone 0.5.2 and the Python/SQL/R Tree-sitter products.
- Swift 6 strict-concurrency simulator build succeeds for the `bIDE` scheme.
- The target remains iPhone + iPad (`TARGETED_DEVICE_FAMILY = 1,2`).

## iPhone editing gate

Test on a physical iPhone:

- Tap into the beginning, middle, and end of an existing line; insertion occurs exactly at the caret.
- Type continuously for at least 30 seconds with no cursor jumps or dropped text.
- Long-press selection handles can select partial text, whole lines, and multiple lines.
- Copy, cut, paste, undo, and redo work with native editing behavior.
- Multi-line paste preserves content and indentation.
- Tab and outdent work with both an insertion point and a multi-line selection.
- Coding toolbar inserts parentheses, brackets, braces, quotes, colon, underscore, and hash without dismissing the workflow.
- Left/right caret controls move predictably through text.
- Completion chips replace the current token without corrupting surrounding text.
- Find Next, Replace Next, and Replace All work from the bIDE find/replace sheet.
- Command-R on a hardware keyboard reaches the Run Selection/File boundary without executing a runtime during Phase 1.
- Opening and closing the software keyboard repeatedly does not lose the active file or selection.
- Portrait/landscape rotation preserves the active project, file contents, and usable editor state.

## Local project gate

- First launch creates one local project with `analysis.py`, `query.sql`, and `model.R`.
- Create, rename, open, and delete projects.
- Create, rename, open, and delete Python/SQL/R files.
- Switching files saves the previous file first.
- Autosave persists edits after the debounce interval.
- Backgrounding the app forces the active document to disk.
- Relaunch restores the most recently active project and file.
- A failed save surfaces an error state instead of silently claiming success.

## iPad gate

- Regular-width iPad shows a persistent file rail beside the editor.
- File selection in the rail updates the editor without losing previous edits.
- Landscape provides materially more editor space rather than scaling the iPhone layout.
- Hardware keyboard editing, native selection, Command-R, and system copy/paste remain functional.

## Scope gate

The Phase 1 native source must not add:

- Python/Pyodide execution
- SQL execution
- webR execution
- StoreKit
- Supabase/PocketBI authentication
- cloud workspace sync
- PocketBI handoff implementation
- additional programming languages

After this checklist passes, the next implementation phase is SQL execution + structured results.
