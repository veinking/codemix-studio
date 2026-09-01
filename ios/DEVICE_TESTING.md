# bIDE iOS Physical Device Test Flow

This guide is for the Phase 1 native editor + local project core. It does **not** require App Store signing, PocketBI authentication, StoreKit, or runtime execution.

## 1. Get the current device package

Use the latest successful `bIDE iOS Quality` run for `agent/bide-ios-foundation`.

Artifact name:

`bIDE-Phase1-Sideloadly-<run number>`

Inside the artifact ZIP, use:

`bIDE-Sideloadly.ipa`

The workflow verifies before upload that the package is:

- `iPhoneOS`
- `arm64`
- targeted to iPhone + iPad
- packaged with code signing disabled for local sideload testing
- structurally valid via `unzip -t`

## 2. Install for local testing

Install `bIDE-Sideloadly.ipa` with the same local sideload workflow used for the other internal app builds.

This package is intentionally unsigned by CI. The local sideload tool performs the temporary signing needed for installation with the tester's Apple ID/device.

Do not add permanent distribution certificates, App Store provisioning, StoreKit products, or production credentials merely to perform this Phase 1 editor test.

## 3. Smoke test before detailed acceptance

On first launch, confirm all of the following before doing the full editor checklist:

1. bIDE launches without immediately requesting sign-in.
2. Workspace is the default working surface.
3. A local starter project exists.
4. The starter project exposes `analysis.py`, `query.sql`, and `model.R`.
5. Opening each file changes the syntax language correctly.
6. Run controls do not attempt real execution yet.
7. Closing and reopening the app preserves local work.

## 4. File ingress smoke test

- Projects → Import Project Folder can import a small local folder.
- Projects → Import Code Files shows standalone `.py`, `.sql`, and `.R` files.
- importing one standalone source file creates and opens a local bIDE project copy.
- from iOS Files, Open/Share in bIDE is available for supported source files.
- the original external file remains unchanged after editing the bIDE copy.

## 5. File export smoke test

- open the Files/project browser inside bIDE and tap the visible share icon.
- Export Project Files opens the native iOS share sheet with all current source files.
- long-press a source file and choose Share File; only that source file is shared.
- Save to Files or another compatible destination receives normal `.py`, `.sql`, or `.R` files.
- edit the active file immediately before sharing and confirm the exported copy contains the latest saved text.

## 6. Full Phase 1 acceptance

Run every item in:

`ios/PHASE_1_EDITOR_ACCEPTANCE.md`

Prioritize the physical interactions that simulator CI cannot prove:

- precise tap-to-place cursor behavior
- long-press selection handles
- copy/cut/paste
- continuous typing stability
- coding toolbar insertion
- completion replacement around the caret
- software keyboard show/hide
- portrait/landscape rotation
- project/file switching while unsaved edits exist
- background + relaunch persistence
- import/open-in-bIDE/export/share behavior
- iPad persistent rail and hardware keyboard behavior

## 7. Reporting a failure

For each failure record:

- device model
- iOS/iPadOS version
- orientation
- active language/file
- whether a hardware keyboard was attached
- exact steps to reproduce
- expected behavior
- actual behavior
- whether relaunch reproduces it

A short screen recording is ideal for cursor, selection, keyboard, rotation, layout, or share-sheet failures.

## 8. Phase boundary

Passing CI is the automated build gate. Passing the physical checklist is the editor + local file workflow gate.

Do not begin Python/SQL/R runtime, authentication, billing, cloud sync, or PocketBI handoff implementation inside the Phase 1 PR until that gate is accepted.

Once accepted, begin the next implementation phase with one shared local Dataset/Asset registry plus **native SQLite execution + structured result inspection** while preserving this editor/project/import/export foundation.
