# bIDE iOS Build / QA Cost Policy

The native iOS project uses GitHub-hosted macOS only for deliberate checkpoints. A source commit, feature completion, PR update, or review-state change is **not** sufficient reason to create a new IPA.

## Two gates

### 1. Source preflight — cheap

Workflow: `bIDE iOS Source Preflight`

Runner: Ubuntu

Run this manually after a meaningful batch of changes is internally complete. It checks the Phase 1 and Phase 2 deterministic validators and verifies that the paid macOS workflow has not regained an automatic trigger.

A failed source preflight must be fixed before any macOS run is considered.

### 2. Native checkpoint — expensive

Workflow: `bIDE iOS Quality`

Runner: macOS + Xcode

This workflow is manual-only. It performs the native simulator build, XCTest regression suite, physical-device IPA build, and artifact upload.

Dispatch it only when all of the following are true:

1. There are no known unfinished fixes in the current batch.
2. The source preflight is green for the intended checkpoint head.
3. The native XCTest set contains regressions for every important bug fixed in the batch when practical.
4. The resulting IPA is worth installing for a real physical-device test session.
5. The tester is expected to exercise a full checklist, not one isolated button or feature.

## Build-number policy

Do not bump `CURRENT_PROJECT_VERSION` for ordinary source commits.

A build number represents an installable QA checkpoint. Multiple fixes and source commits may accumulate behind one future build number. Increment the build only immediately before the next intentional native checkpoint.

## Failure policy

Do not blindly re-run a failed macOS job.

1. Read the failing step/logs.
2. Fix all identifiable source/configuration problems in one batch.
3. Re-run deterministic source checks first.
4. Re-run the macOS checkpoint only after the batch is coherent again.

If the simulator build passes but a later native test fails, preserve that information and repair the failing regression rather than restarting the entire development cycle around the single failure.

## Physical-device batching

One IPA should cover a broad acceptance pass. For the current Phase 2 gate, a phone session should cover at least:

- Orders → Customers LEFT JOIN integrity
- stale derived SQLite migration after installing over an older build
- Join Results presentation/recovery
- Create Editable Join Query routing
- Share Result as CSV correctness
- Save Result as Dataset verification and relaunch persistence
- export beyond the 500-row preview
- multi-sheet XLSX import
- source/original-file sharing vs query-result export clarity

Record every failure from the session before requesting another IPA. Patch the whole failure set, add regression coverage where practical, then create the next checkpoint.

## Branch / PR policy

Phase 2 remains stacked on `agent/bide-ios-foundation` until explicitly merged. Keep PR #17 in Draft during active development.

Do not use PR `ready_for_review` as a build trigger. Temporary build-gate branches are not required for normal work now that the macOS workflow is manual-only.

## Scope discipline

A native checkpoint should not grow into a release train for unrelated work. Phase 2 remains focused on local datasets + native SQL. Python execution starts only after the Phase 2 data-integrity/device gate is accepted.
