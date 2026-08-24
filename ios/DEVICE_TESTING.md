# bIDE iOS Physical Device Test Flow

This guide covers the native editor/project foundation plus the current Phase 2 local Dataset + native SQL checkpoint. It does **not** require App Store signing, PocketBI authentication, StoreKit, cloud sync, Python execution, or R execution.

## 1. Only install intentional checkpoint builds

Do not create or install an IPA for every source change.

Follow `ios/BIDE_IOS_BUILD_POLICY.md`:

1. Batch source fixes.
2. Run the cheap `bIDE iOS Source Preflight` once when the batch is coherent.
3. Run the manual macOS `bIDE iOS Quality` checkpoint only when the IPA is worth a full device session.
4. Record the whole phone-test failure set before requesting another checkpoint.

The `bIDE iOS Quality` artifact contains `bIDE-Sideloadly.ipa`. The workflow verifies the package is an unsigned arm64 iPhoneOS build targeted to iPhone + iPad and structurally valid for local sideload signing.

## 2. Install over the existing bIDE app when testing migration

For the current Phase 2 regression, install the next checkpoint over the existing bIDE installation using the same bundle ID. Do **not** delete the app first unless a separate clean-install test is explicitly required.

The update path matters because older builds can leave project-local derived `.bide.sqlite` state behind. The current app must reconcile source datasets, detect an old derived-database generation, and rebuild local SQL state from registered source assets.

Source CSV/XLSX files and the dataset registry remain the authoritative project data. `.bide.sqlite` is derived state.

## 3. Phase 1 smoke test

Before spending time on data workflows, confirm the editor shell still behaves normally:

1. bIDE launches without immediately requesting sign-in.
2. Workspace opens a local project.
3. Python, SQL, and R source files still select the correct editor language.
4. Projects/files remain local and survive relaunch.
5. basic import/share behavior still opens the native Files/share surfaces.

Run the complete editor checklist in `ios/PHASE_1_EDITOR_ACCEPTANCE.md` when a change touches the editor/project shell.

## 4. Current Phase 2 regression bundle

Use:

- `bIDE_Join_Practice_Orders.csv`
- `bIDE_Join_Practice_Customers.csv`
- `bIDE-Phase2-Test-MultiSheet.xlsx`

### A. Verify source datasets after update

Open Datasets and confirm the clean practice sources are still intact:

- Orders: **27 rows / 7 columns**
- Customers: **15 rows / 5 columns**

A stale/corrupted derived result must not silently redefine those source values.

### B. Guided LEFT JOIN

Open `Join Two Tables` and choose:

- Left table: Orders
- Right table: Customers
- Left key: `customer_id`
- Right key: `customer_id`
- Join type: Left

Run `Run Join & View Results`.

Expected:

- exactly **27 result rows**
- **12 result columns**
- `O1025 / C999` retained with blank/NULL customer-side fields
- `O1026 / C888` retained with blank/NULL customer-side fields
- repeated values remain unchanged, including `C001`, `Starter Plan`, `1`, `49.0`, `VA`, and other repeated cell values
- ordinary row values never become suffixed data such as `C001_2`, `Starter Plan_2`, `1_2`, or `49.0_2`

Duplicate **column headers** may be disambiguated safely, for example the second `customer_id` can become `customer_id_2` when a CSV is re-imported. Cell values must not be renamed.

### C. Result presentation recovery

Dismiss Join Results and confirm Datasets shows:

`Last Join Result` → `Open Join Results`

Reopen the completed result. The join must not appear lost because a sheet was dismissed.

### D. Share Result as CSV

From Join Results / SQL Results choose `Share Result as CSV`.

The CSV must be one joined table:

- 12 columns per joined row
- 27 rows for this fixture
- no Orders table followed by a pasted Customers table
- no Customers header appended to the final Orders row
- no data-value suffix mutation

### E. Save Result as Dataset

Choose `Save Result as Dataset`.

Confirm the new dataset reports:

- 27 rows
- 12 columns

Open/query it again and compare sampled values to the visible join result.

Fully terminate bIDE, reopen it, and confirm:

- original Orders remains
- original Customers remains
- the saved join-result dataset remains
- the saved result is still queryable

### F. Editable join query routing

Run `Join Two Tables` again and choose `Create Editable Join Query`.

Expected:

- the builder dismisses cleanly
- Workspace becomes visible only after dismissal
- a new `join_<left>_<right>.sql` file is active
- if SQL-file creation fails, the Join Builder stays open and reports the failure instead of disappearing

### G. Full-result export beyond screen preview

Run a read-only query returning more than 500 rows.

The result screen may preview only the first 500 rows, but `Share Result as CSV` must contain the complete result. `Save Result as Dataset` must also use and verify the complete result rather than the UI preview.

### H. Multi-sheet XLSX

Import `bIDE-Phase2-Test-MultiSheet.xlsx`.

Expected SQL tables:

- `Inventory` — **6 data rows / 5 columns**
- `Regions` — **3 data rows / 3 columns**

Worksheet names should be the natural SQL-table bases unless a collision requires a normal uniqueness suffix.

### I. Original source sharing vs query export

Confirm Datasets labels source-file sharing as `Share Original Dataset Files` and explains that join/query CSV export lives inside SQL Results.

The original-file action must never be mistaken for exporting the current join result.

## 5. Damaged-file behavior

A structurally inconsistent CSV must fail closed instead of being normalized into a misleading giant table.

Examples that should be rejected:

- unterminated quoted field
- a header that strongly indicates most row separators were lost
- a 7-column header followed by a 12-field data row suggesting another table/header was appended

The app should surface a useful import/rebuild error and preserve the underlying source file for diagnosis rather than inventing hundreds of columns or renaming ordinary cell values.

## 6. Reporting a failure

For each failure record:

- checkpoint version/build
- device model
- iOS/iPadOS version
- orientation
- exact steps to reproduce
- dataset/query involved
- expected behavior
- actual behavior
- whether relaunch reproduces it

For data-integrity issues, also save/share the produced CSV if possible. For cursor, keyboard, layout, routing, or disappearing-sheet issues, a short screen recording is ideal.

Do not request a new IPA immediately after the first failure. Finish the planned session and collect the entire failure set so the next source batch can address them together.

## 7. Phase boundary

Passing source preflight and macOS CI proves the code compiled and the native regression suite passed. Physical-device acceptance proves the iOS interaction, persistence, update migration, Files/share surfaces, and actual installed-app behavior.

Do not begin the Phase 3 Python runtime inside the Phase 2 branch until this local-data/native-SQL gate is accepted on device. Phase 3 should reuse the same project files and Dataset/Asset registry rather than inventing a second data system.
