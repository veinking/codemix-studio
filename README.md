# CodeMix Studio / bIDE

bIDE is the mobile-first Python, SQL, and R IDE being developed in this repository. The current native iPhone/iPad work lives under `ios/` and is intentionally staged so the editor/project core is validated before runtimes, authentication, billing, and PocketBI cloud integrations are added.

## Native bIDE status

Phase 1 focuses on:

- Runestone-powered native editing for Python / SQL / R
- local projects and files
- project/file autosave and restoration
- iPhone/iPad layouts
- import of project folders or standalone Python/SQL/R files
- iOS Open/Share in bIDE for supported source files

The next phase is a shared local Dataset/Asset model plus native SQLite execution and structured SQL results. Dataset ingress will then extend the same local-first Files/Open-in-bIDE model to CSV, TSV, JSON, Excel, text, and later Parquet where practical.

The web/PWA product remains in the existing React/Vite application and is not replaced by the native shell during this work.
