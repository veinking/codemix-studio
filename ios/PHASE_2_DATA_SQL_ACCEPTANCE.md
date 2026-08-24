# bIDE iOS Phase 2 — Data + Native SQL Acceptance

Phase 2 turns the accepted native editor/project foundation into a usable local mobile data IDE. Python and R execution, PocketBI ID, cloud sync, StoreKit, and ecosystem handoffs remain out of scope for this gate.

## Automated build gate

- Phase 1 baseline validator still passes.
- Phase 2 data/SQL validator passes.
- CoreXLSX is pinned to exactly 0.14.2.
- Native SQLite is linked through `libsqlite3.tbd`; sql.js is not used by the native SQL path.
- Swift 6 strict-concurrency simulator build succeeds for iPhone + iPad.
- Native XCTest executes the real parser → SQLite → LEFT JOIN → full CSV export → parser round trip using the phone-test Orders/Customers shape.
- The regression asserts Orders-left LEFT JOIN returns exactly 27 rows, retains `C999` and `C888` with NULL customer-side fields, preserves ordinary values such as `C001`, `Starter Plan`, `1`, and `49.0`, and re-imports the exported CSV as 27 rows / 12 columns.
- A deliberately flattened/damaged CSV fixture must fail closed instead of becoming a 0-row / hundreds-of-columns dataset with values renamed as headers.
- Unsigned arm64 physical-device IPA packages successfully.
- Current audited target is app version 0.2.5 build 7.

## Audited real-device checkpoint

Use `bIDE_Join_Practice_Orders.csv`, `bIDE_Join_Practice_Customers.csv`, and `bIDE-Phase2-Test-MultiSheet.xlsx` for the final hardware pass.

- From Datasets, `Join Two Tables` visibly offers `Run Join & View Results`; the tester should not have to create a SQL file and hunt for the Run button just to inspect a guided join.
- `Run Join & View Results` must dismiss the Join Builder first and only then present Join Results; the results sheet must not flash and disappear during the modal handoff.
- After a successful guided join, Datasets keeps a visible `Last Join Result` → `Open Join Results` breadcrumb so dismissing the result sheet cannot make the completed join appear lost.
- `Create Editable Join Query` must verify that a new active `.sql` file was actually created before dismissing. If creation fails, the Join Builder stays open and shows an error.
- After a successful `Create Editable Join Query`, the Join Builder dismisses before bIDE switches to Workspace, and the newly created SQL file remains active and visible.
- The join flow must behave the same whether the user started in Datasets or Workspace; no pre-existing SQL tab ritual or manually empty project is required.
- For the phone regression, select **Orders as the left table**, **Customers as the right table**, `customer_id ↔ customer_id`, and `Left` join. The result must contain exactly 27 rows. `C999` and `C888` remain because they are left-side Orders rows, with NULL/blank customer-side fields.
- Ordinary source values must remain data values. They must never become generated headers such as `C001_2`, `Starter Plan_2`, `1_2`, or `49.0_2`.
- From Join Results / SQL Results, `Save Result as Dataset` creates a reusable local dataset. After fully terminating bIDE and reopening it, both original CSV assets and the saved result must still appear in the project.
- `Share Result as CSV` must contain the complete read-only query result from SQLite, including rows beyond the 500-row screen preview.
- `Share Original Dataset Files` must be clearly distinct from query/join export. It shares the imported source files only; it must never be presented as the way to export a join result.
- Importing `bIDE-Phase2-Test-MultiSheet.xlsx` must expose both non-empty worksheets as SQL tables using the worksheet names as their natural table bases:
  - `Inventory` — 6 data rows / 5 columns
  - `Regions` — 3 data rows / 3 columns
- If the fixture names collide with an existing SQL table, normal uniqueness suffixing is allowed; otherwise the workbook filename must not obscure the worksheet table names.

## Discoverability gate

Critical data actions must be visible without guessing that they live behind an ellipsis menu.

- Datasets visibly exposes Import Dataset.
- With two or more SQL tables, Datasets visibly exposes Join Two Tables.
- Join Two Tables visibly exposes Run Join & View Results and Create Editable Join Query.
- A directly run guided join returns to a native Join Results sheet with the same result actions as ordinary SQL execution.
- A completed guided join leaves a visible Last Join Result / Open Join Results recovery path in Datasets.
- Datasets visibly exposes Rebuild SQL Database and Share Original Dataset Files once data exists.
- The original-file share copy explicitly says it is not a SQL/join-result export.
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
- multi-sheet XLSX worksheet names are used as the natural SQL-table bases rather than being prefixed by the workbook filename
- delimited files with unterminated quoted fields fail closed rather than guessing row boundaries
- files whose header width strongly indicates lost row separators fail closed rather than reinterpreting ordinary values as hundreds of column headers

## Data integrity gate

- repeated cell values remain repeated values; bIDE must never suffix ordinary data such as `VA`, `VA_2`, `VA_3` merely because the value occurs more than once.
- duplicate column headers may be disambiguated for SQL safety, but row values must remain untouched.
- leading-zero identifiers such as `00123` remain text rather than becoming `123`.
- full-result CSV export records the actual streamed columns, full row count, and a bounded value sample.
- before bIDE shares or saves a SQL-result CSV, the streamed export columns and sampled rows must match the exact SQL result that was shown.
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
- sharing one dataset and sharing all original dataset source files opens the native iOS share sheet.
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
- the guided join can be run directly and viewed without first creating a SQL file.
- generated join SQL can still be saved as normal editable SQL in Workspace.
- modal dismissal and tab/result presentation are serialized so one transition cannot cancel the next.

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

When this checklist passes, bIDE has a real standalone local SQL + dataset workflow on iPhone/iPad. Phase 3 can then reuse the same project assets for Python instead of inventing a second file/data system.
