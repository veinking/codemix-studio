# bIDE iOS App Flow

This native client is intentionally isolated under `ios/` and must not change the existing bideide.com web/PWA behavior unless a later PR explicitly does so.

## Product boundary

V1 is a focused coding and data workbench for iPhone and iPad.

Primary V1 languages:
- Python
- SQL
- R

Do not expand V1 into a broad all-language IDE, marketplace, source-control platform, or PocketBI replacement.

## Default user flow

1. **Launch directly into Workspace**
   - Local-first; no forced sign-in wall.
   - Resume the most recent local project when available.

2. **Workspace**
   - Touch-friendly code editor.
   - Syntax highlighting, selection, keyboard commands, and contextual completion.
   - Choose Python, SQL, or R.
   - Run code and show output without leaving the workspace.

3. **Projects**
   - Create/open local projects.
   - Project filesystem contains code, notebooks/workbooks, and imported datasets.
   - Cloud sync is optional and belongs behind account sign-in.

4. **Datasets**
   - Import local CSV/XLSX files.
   - Accept trusted PocketBI dataset handoffs.
   - Expose dataset names/columns to editor completion and code helpers.

5. **PocketBI round trip**
   - PocketBI -> bIDE: receive a cleaned dataset and open it in a project.
   - bIDE -> PocketBI: export the resulting dataset for PocketClean re-audit and/or PocketViz.
   - Do not directly mutate PocketBI production data from the native client in V1.

6. **Account and entitlements**
   - Core local workspace can open without sign-in.
   - bIDE Pro can be purchased standalone.
   - PocketBI Pro entitlement unlocks bIDE Pro.
   - PocketBI Business entitlement unlocks the applicable bIDE Pro features plus later organization integrations.
   - App Store and web purchases must eventually resolve through the same PocketBI identity/entitlement service.

## Native navigation

### iPhone
Bottom navigation:
- Workspace
- Projects
- Datasets
- Account

### iPad
Sidebar + detail layout using the same four destinations. The editor remains the primary detail surface and should take advantage of keyboard/trackpad input when available.

## Build phases

### Phase A - Foundation
- SwiftUI app shell
- iPhone/iPad navigation
- XcodeGen project
- CI build validation
- entitlement model placeholders

### Phase B - Native editor
- production code editor surface
- touch selection and keyboard behavior
- project/file model
- autosave
- Python/SQL/R language switching

### Phase C - Runtime + data
- Python runtime
- SQL runtime
- R runtime where viable
- CSV/XLSX import and preview
- dataset-aware completions

### Phase D - Identity + paid access
- shared PocketBI sign-in
- entitlement resolution
- StoreKit purchase/restore
- inherited PocketBI Pro/Business access

### Phase E - ecosystem handoff
- trusted PocketBI -> bIDE deep link/file handoff
- export/send-back flow
- PocketClean re-audit and PocketViz continuation

## Safety rule

Every native change starts on an isolated branch and reaches `main` only through an explicit PR after CI validation. Backend, billing, and PocketBI production integrations remain disconnected until their dedicated phases.
