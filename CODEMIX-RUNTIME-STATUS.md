# bIDE Runtime Status

**Updated:** 2026-08-14

This file is a release checklist, not a marketing claim. A runtime is only marked ready after the current bIDE editor, execution path, error handling, and mobile behavior have been tested together.

## Enabled today

| Language | Editor | Execute in bIDE | Status |
| --- | --- | --- | --- |
| Python | Yes | Browser/Pyodide | Enabled; release smoke test still required |
| R | Yes | Browser/webR | Enabled; release smoke test still required |
| JavaScript | Yes | Browser | Enabled; release smoke test still required |
| SQL | Yes | Browser | Enabled; release smoke test still required |

These four languages are the only languages currently wired through the full `IDE.tsx` scratch/file state and runtime registration path.

## Runtime candidates under validation

| Language | Editor support | Runtime implementation | Selector state |
| --- | --- | --- | --- |
| Ruby | Monaco snippets | ruby.wasm browser runtime refreshed | Runtime next |
| Lua | Monaco snippets | Fengari runtime corrected | Runtime next |
| PHP | Monaco snippets | Existing runtime needs API/browser validation | Runtime next |

Ruby and Lua must stay disabled in the user-facing language selector until their runtime initialization, stdout/stderr, syntax/runtime errors, repeated runs, and iPhone behavior pass a browser smoke test.

PHP must not be enabled merely because a runtime class exists. Its current third-party browser bootstrap must be verified or replaced first.

## Editor-first languages

bIDE already has editor/completion definitions for these languages, but does not promise local compilation/execution yet:

- TypeScript
- Java
- C
- C++
- C#
- Rust
- Go
- Swift
- Kotlin

These should remain **Editor next** until the file model supports them end-to-end. Remote execution, if added later, should use an explicit isolated execution service rather than pretending every compiler belongs inside the browser.

## Mobile editor release gate

The current mobile Monaco configuration intentionally removes expensive background/editor behavior that is not essential while typing:

- no automatic suggestions on every character
- no trigger-character suggestions
- no parameter hints/hover links
- no word-based suggestions
- no bracket-pair coloring/guides
- no sticky scroll or occurrence highlighting
- no smooth caret animation
- additional bottom padding for the software keyboard
- no forced editor focus when the editor mounts on mobile

Desktop keeps the richer completion experience.

Before packaging bIDE as a native app/WebView, verify on an iPhone-sized viewport:

1. tap into an existing line and type continuously for at least 30 seconds
2. insert/delete text in the middle of a line without cursor jumps
3. paste a multi-line block
4. select/copy text with native handles
5. open/close the software keyboard repeatedly
6. rotate portrait/landscape and keep the active document/cursor usable
7. open the console and return to the editor without losing the document
8. switch files and confirm the correct buffer is shown

## Execution release gate

Every executable runtime must satisfy the same contract:

1. initialize once and expose a stable Ready state
2. stream stdout without duplicating it in the final result
3. return runtime errors as errors, not success text
4. never show `Execution completed` after `result.error`
5. isolate output from consecutive runs
6. recover cleanly after a failed run
7. enforce a reasonable timeout or provide cancellation for long-running work
8. avoid leaking browser/WASM implementation noise when a clearer runtime error is available

The current IDE controller still needs work on items 4-7. Console-side filtering prevents some misleading success text, but the source execution path should be corrected before calling the runtime layer finished.

## Architecture work still needed

`src/pages/IDE.tsx` still owns too many responsibilities: files, scratch buffers, runtime registration/execution, console state, datasets, plots, storage, mobile drawers, AI, and feature modals. Continued hardening should move toward separate controllers/hooks for:

- editor/document state
- persistence/files
- runtime execution
- console/output
- workspace/datasets

That separation is a prerequisite for a smooth native wrapper and for safely expanding the executable-language set.
