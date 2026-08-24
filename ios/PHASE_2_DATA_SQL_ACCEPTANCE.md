# bIDE iOS Phase 2 — Data + Native SQL Acceptance

Phase 2 turns the native editor/project foundation into a usable local mobile data IDE. Python and R execution, PocketBI ID, cloud sync, StoreKit, and ecosystem handoffs remain out of scope for this gate.

## Build / CI policy

Follow `ios/BIDE_IOS_BUILD_POLICY.md`.

- Source work is batched; a feature commit does not create an IPA.
- `bIDE iOS Source Preflight` is the cheap manual Ubuntu gate for deterministic source/config validation.
- `bIDE iOS Quality` is the expensive manual-only macOS/Xcode checkpoint.
- Never attach push, pull-request, ready-for-review, or schedule triggers to the paid macOS lane.
- Do not bump the app build number until a batch is actually ready to become an installable QA checkpoint.
- A failed macOS job is investigated and repaired as a batch before another paid run is dispatched.

## Current checkpoint status

The previous native checkpoint completed successfully through simulator build, native XCTest join/export regressions, physical-device IPA packaging, and artifact upload.

Additional source safeguards landed after that checkpoint, including the stricter phone-corruption shape guard and one-time derived SQLite migration. Therefore the current branch is **source-complete but not yet the next native-audited checkpoint**. Do not spend another macOS run until the current Phase 2 batch is ready for a full phone session.

## Automated native gate

When the next intentional macOS checkpoint is dispatched, all of the following must pass in one run:

- Phase 1 baseline validator.
- Phase 2 data/SQL validator.
- CoreXLSX pinned exactly to 0.14.2.
- Native SQLite linked through `libsqlite3.tbd`; sql.js is not used by the native SQL path.
- Swift 6 strict-concurrency simulator build for iPhone + iPad.
- Native XCTest real parser → SQLite → LEFT JOIN → full CSV export → parser round trip using the phone-test Orders/Customers shape.
- Orders-left LEFT JOIN returns exactly 27 rows / 12 columns.
- `C999` and `C888` remain with NULL customer-side fields.
- ordinary values such as `C001`, `Starter Plan`, `1`, and `49.0` remain unchanged.
- exported joined CSV re-imports as exactly 27 rows / 12 columns.
- flattened/lost-row-separator corruption fails closed.
- the exact phone corruption shape — a 7-column header followed by a 12-field row containing the appended Customers header — fails closed as structurally inconsistent.
- unsigned arm64 physical-device IPA packages successfully.

## Update / derived-database gate

`.bide.sqlite` is derived state; registered project source assets remain authoritative.

On project open bIDE must:

1. open the project dataset registry,
2. reconcile project source files,
3. check the local derived-database generation,
4. rebuild stale/missing derived SQLite state before normal SQL use,
5. write the new generation marker only after a successful rebuild.

Installing a newer bIDE build over an older build must not require deleting the app merely to clear stale derived SQL state.

A damaged registered source/result file must fail closed with a useful error rather than being interpreted as a giant valid dataset.

## Audited real-device checkpoint

Use `bIDE_Join_Practice_Orders.csv`, `bIDE_Join_Practice_Customers.csv`, and `bIDE-Phase2-Test-MultiSheet.xlsx` for the final hardware pass. Follow `ios/DEVICE_TESTING.md` and complete the whole planned session before requesting another IPA.

### Guided join routing

- From Datasets, `Join Two Tables` visibly offers `Run Join & View Results`.
- direct join execution dismisses the Join Builder before presenting Join Results; the result sheet must not flash and disappear during the modal handoff.
- Datasets keeps `Last Join Result` → `Open Join Results` after a successful guided join.
- `Create Editable Join Query` verifies a new active `.sql` file before dismissing.
- if query-file creation fails, the Join Builder remains visible with an error.
- after successful editable-query creation, the builder dismisses before bIDE switches to Workspace.
- the join flow works whether the user started from Datasets or Workspace; no pre-existing SQL tab ritual is required.

### Exact phone join

Select:

- left: Orders
- right: Customers
- `customer_id ↔ customer_id`
- Left join

Expected:

- 27 rows
- 12 columns
- `O1025 / C999` retained with NULL/blank customer-side fields
- `O1026 / C888` retained with NULL/blank customer-side fields
- no data mutation such as `C001_2`, `Starter Plan_2`, `1_2`, `49.0_2`, or `VA_2`

Duplicate **column headers** may be disambiguated for SQL/CSV safety; ordinary cell values must never be renamed.

### Result reuse / export

- `Share Result as CSV` must be one complete joined result, never Orders followed by an appended Customers table.
- the Customers header must never be glued onto the final Orders row.
- full read-only result export is not limited to the 500-row screen preview.
- before share/save, streamed export columns and sampled values must match the exact displayed SQL result.
- `Save Result as Dataset` verifies complete row count, column count, and sampled values.
- failed result verification removes the bad derived dataset instead of reporting success.
- a saved result remains after a full app kill/relaunch and can be queried again.
- `Share Original Dataset Files` is clearly distinct from query/join export and must not be presented as the way to export a result.

### Multi-sheet XLSX

Import `bIDE-Phase2-Test-MultiSheet.xlsx`.

Expected:

- `Inventory` — 6 data rows / 5 columns
- `Regions` — 3 data rows / 3 columns

Worksheet names are the natural SQL-table bases unless a normal table-name collision requires a uniqueness suffix.

## Dataset ingress gate

On a physical iPhone verify the active project can import:

- CSV, including quoted commas and quoted multiline text
- TSV
- JSON array-of-objects
- delimited text and plain one-column text
- XLSX with one sheet
- XLSX with multiple non-empty sheets

Legacy `.xls` remains intentionally unsupported in Phase 2.

Also verify:

- multiple dataset files can be selected in one Files import
- Files → Open/Share in bIDE sends supported dataset formats into the active project
- existing CSV/TSV/XLSX project files are discovered without a second import
- JSON/TXT outside `data/` are not blindly auto-classified
- bIDE metadata JSON files never appear as datasets
- imported sources remain local and survive relaunch
- unterminated quoted fields fail closed
- a header strongly indicating lost row separators fails closed
- a data row wider than its declared header fails closed instead of inventing extra columns

## Data integrity gate

- repeated cell values stay repeated values.
- duplicate column headers may be disambiguated; row values may not.
- leading-zero identifiers such as `00123` remain text.
- full-result export records the actual streamed columns, row count, and a bounded value sample.
- export/share verification compares streamed schema/sample to the exact query result.
- Save Result as Dataset verifies complete row count, column count, and sampled values after re-import.
- Share Result as CSV is based on the exact read-only SQLite statement result.
- mutating `... RETURNING` statements are not re-run merely to export.

## Dataset inspection / persistence gate

- Datasets shows active project, dataset count, and SQL-table count.
- each dataset shows format, size, row count, table count, schema, and preview.
- table preview displays the first 50 rows without freezing navigation.
- source-file sharing opens the native iOS share sheet.
- deletion requires confirmation and removes source asset plus generated tables.
- `Rebuild SQL Database` recreates queryable tables from registered source assets.
- datasets in Project A do not appear in Project B.
- `datasets.bide.json` restores metadata after relaunch.
- `.bide.sqlite` remains internal derived state.

## Native SQL gate

- `SELECT * FROM <table> LIMIT 10;` returns a structured native table.
- Run Selection executes selected SQL; otherwise Run executes the file.
- the active file language is authoritative for runtime routing.
- multiple statements are reported as separate result sets.
- SQLite syntax errors surface actual error text.
- INSERT/UPDATE/DELETE reports affected-row counts.
- preview is capped at 500 rows with visible truncation disclosure.
- full read-only export can exceed the screen preview.

## SQL ergonomics / discoverability gate

- SQL autocomplete suggests imported tables and columns.
- SQL editor shows available project table count.
- Dataset → Query in SQL creates editable SQL.
- Join Two Tables supports left/right tables, key columns, INNER, and LEFT joins.
- join suggestions prioritize likely shared keys such as `customer_id` / `*_id`.
- direct guided join can run without first creating a SQL file.
- generated join SQL can be opened as a normal editable Workspace file.
- Datasets visibly exposes Import Dataset, Join Two Tables, Rebuild SQL Database, and Share Original Dataset Files where applicable.
- SQL Results visibly exposes Share Result as CSV and Save Result as Dataset.
- zero-row results show `No Rows Returned` rather than a blank panel.
- SQL Results can disclose the exact SQL that ran.

## iPad gate

- Datasets and structured result tables remain usable at regular width.
- horizontal result scrolling does not collapse navigation.
- landscape provides materially more editor/result space.
- Phase 1 hardware-keyboard/editor acceptance remains intact.

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

When the source gate, one intentional native macOS checkpoint, and the complete physical-device checklist all pass, Phase 2 is accepted. Phase 3 can then reuse the same project files, datasets, and local data model for Python instead of inventing a parallel storage system.
