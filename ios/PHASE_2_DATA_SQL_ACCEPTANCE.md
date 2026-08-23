# bIDE iOS Phase 2 — Data + Native SQL Acceptance

Phase 2 turns the accepted native editor/project foundation into a usable local mobile data IDE. Python and R execution, PocketBI ID, cloud sync, StoreKit, and ecosystem handoffs remain out of scope for this gate.

## Automated build gate

- Phase 1 baseline validator still passes.
- Phase 2 data/SQL validator passes.
- CoreXLSX is pinned to exactly 0.14.2.
- Native SQLite is linked through `libsqlite3.tbd`; sql.js is not used by the native SQL path.
- Swift 6 strict-concurrency simulator build succeeds for iPhone + iPad.
- Unsigned arm64 physical-device IPA packages successfully.
- Audited checkpoint reports app version 0.2.1 build 3.

## Discoverability gate

Critical data actions must be visible without guessing that they live behind an ellipsis menu.

- Datasets visibly exposes Import Dataset.
- With two or more SQL tables, Datasets visibly exposes Join Two Tables.
- Datasets visibly exposes Rebuild SQL Database and Export Dataset Files once data exists.
- Dataset detail visibly exposes Export This Dataset.
- SQL Results visibly exposes Share Result as CSV and Save Result as Dataset for read-only results.
- a saved result offers a direct View Datasets action.
- zero-row SQL results show a clear No Rows Returned state instead of a large blank result panel.
- SQL Results can disclose the exact SQL that ran so accidental selection/routing mistakes can be diagnosed on-device.

## Dataset ingress gate

On a physical iPhone, verify the active project can import:

- CSV, including quoted commas and quoted multiline text
- TSV
- JSON array-of-objects
- delimited text and plain one-column text
- XLSX with one sheet
- XLSX with multiple non-empty sheets, each becoming a separate SQL table

Legacy `.xls` is intentionally not claimed in Phase 2. Convert legacy workbooks to XLSX or CSV before import.

Also verify:

- multiple dataset files can be selected in one Files import
- Files → Open/Share in bIDE sends supported dataset formats into the active project
- a project folder that already contains CSV/TSV/XLSX discovers those files without requiring a second import
- JSON/TXT outside a `data/` directory are not blindly auto-classified during project-folder discovery
- bIDE metadata JSON files are never shown as datasets
- imported dataset source files remain local to the project and survive relaunch

## Data integrity gate

- repeated cell values remain repeated values; bIDE must never suffix ordinary data such as `VA`, `VA_2`, `VA_3` merely because the value occurs more than once.
- duplicate column headers may be disambiguated for SQL safety, but row values must remain untouched.
- leading-zero identifiers such as `00123` remain text rather than becoming `123`.
- Save Result as Dataset verifies complete exported row count before reporting success.
- Save Result as Dataset verifies imported column count against the query result.
- Save Result as Dataset round-trips and compares a sample of actual values; a failed verification removes the derived dataset rather than retaining altered output.
- Share Result as CSV is based on the exact read-only SQLite statement result and is not limited to the visible preview.

## Dataset inspection gate

- Datasets shows the active project name plus dataset and SQL-table counts.
- Every dataset displays format, file size, row count, and table count.
- Dataset detail exposes all generated SQL tables.
- Table detail exposes SQL table name, row count, column names, and inferred SQLite affinity.
- Table preview displays the first 50 rows without freezing navigation.
- sharing one dataset and sharing all dataset source files opens the native iOS share sheet.
- deleting a dataset requires explicit confirmation and removes its source asset and generated SQL tables.
- Rebuild SQL Database recreates queryable tables from the registered source assets.

## Native SQL gate

Use known-good test queries rather than requiring the tester to remember SQL syntax.

- `SELECT * FROM <table> LIMIT 10;` returns a structured native table.
- Run Selection executes selected SQL; with no selection, Run executes the file.
- the active file's own language is authoritative for runtime routing, preventing a newly opened `.sql` file from briefly falling through to the Python/R runtime placeholder.
- multiple SQL statements in one run are reported as separate result sets.
- SQL syntax errors surface the actual SQLite error instead of silently failing.
- INSERT/UPDATE/DELETE statements report affected-row counts.
- query previews are capped at 500 rows and visibly disclose truncation.
- short result sets do not create a large empty scroll region.
- large SELECT results can still export the complete read-only result to CSV rather than only the 500-row on-screen preview.
- mutating `... RETURNING` results are not re-run for export.

## SQL ergonomics gate

- SQL autocomplete suggests imported table names.
- SQL autocomplete suggests known table/column references.
- SQL editor header shows how many project tables are available.
- Dataset → Query in SQL creates an editable query file against the selected table.
- Join Two Tables lets the user choose left/right tables, matching columns, and INNER or LEFT join without memorizing join syntax.
- the guided join builder prefers same-named columns and prioritizes likely keys such as `customer_id` / other `*_id` fields rather than blindly choosing each table's first column.
- generated join SQL remains normal editable SQL in Workspace.

## Result reuse gate

- Share Result as CSV exports a complete read-only query result through the iOS share sheet.
- Save Result as Dataset creates a verified project-local CSV asset.
- the saved result appears in Datasets with schema/row metadata.
- the saved result receives its own SQLite table and can be queried again.
- saving a result with duplicate output column names may safely disambiguate headers while preserving all row values.

## Project isolation / persistence gate

- datasets in Project A do not appear in Project B.
- switching projects while data work is in progress does not overwrite another project's registry.
- `datasets.bide.json` restores project dataset metadata after relaunch.
- `.bide.sqlite` remains an internal derived database, not a user-facing source asset.
- source assets remain authoritative enough for Rebuild SQL Database to recover local SQL tables.

## iPad gate

- Datasets navigation and structured result tables remain usable at regular width.
- horizontal result scrolling does not collapse the surrounding navigation layout.
- landscape exposes materially more result-table/editor space.

## Phase 2 scope gate

Do not add yet:

- Pyodide / Python execution
- webR / R execution
- WKWebView runtime host
- PocketBI authentication or cloud transfer
- StoreKit
- persistent cloud workspace storage
- arbitrary remote database connectors
- Git/terminal/debugger/LSP features

## Exit

When this checklist passes, bIDE has a real standalone local SQL + dataset workflow on iPhone/iPad. Phase 3 can then reuse the same project assets for Pyodide/Python instead of inventing a second file/data system.
