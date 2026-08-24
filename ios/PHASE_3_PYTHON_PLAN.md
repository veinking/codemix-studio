# bIDE iOS Phase 3 — Python Runtime Plan

**Planning only. Implementation remains blocked until Phase 2 local-data/native-SQL acceptance passes on physical hardware.**

Phase 3 should make Python feel native to the existing bIDE project/editor/data model instead of creating a parallel notebook product or a second dataset system.

## Product goal

A user should be able to open a `.py` file on iPhone/iPad, write normal Python, run a selection or the file, inspect stdout/errors/dataframe output, read the same local datasets SQL already uses, and save/export resulting files without leaving the project.

V1 Python is local-first and self-contained. It does not require PocketBI sign-in or cloud execution.

## Architecture boundary

Add a narrow runtime abstraction before choosing the final embedded engine.

Suggested shape:

- `PythonRuntimeService`
  - prepare runtime
  - execute code
  - cancel execution where supported
  - reset session
  - expose runtime/package versions
- `PythonExecutionRequest`
  - source code
  - project ID
  - active file URL/name
  - working directory
  - selection/file mode
- `PythonExecutionReport`
  - stdout
  - stderr
  - exception/traceback
  - duration
  - structured result metadata when available
  - generated file/output references

Workspace should depend on this interface, not directly on Pyodide/CPython implementation details.

## Runtime choice

Before implementation, compare a bundled/self-contained runtime approach with these requirements:

1. Works fully on-device after install.
2. Does not require downloading executable runtime/package code to make core features work.
3. Can run user-authored `.py` files and selections.
4. Can read/write files inside the active bIDE project sandbox.
5. Can support a curated data stack suitable for mobile analytics.
6. Has predictable memory/startup behavior on iPhone and iPad.
7. Can surface stdout, stderr, and Python tracebacks cleanly into SwiftUI.
8. Can be packaged reproducibly in the native checkpoint workflow.

Do not couple the UI to a CDN-backed package loader. Arbitrary network package installation is not a Phase 3 V1 requirement.

## Curated V1 package target

Aim for the smallest dependable analytics set rather than a desktop-sized environment.

Priority:

- Python standard library
- `numpy`
- `pandas`
- a plotting path suitable for static chart output if dependable

Consider later only after size/runtime testing:

- `scipy`
- `scikit-learn`
- `pyarrow`

Do not add packages merely because the existing web Pyodide worker loads them today.

## Reuse the Phase 2 data model

Phase 3 must reuse:

- `WorkspaceStore` project identity/files
- `DatasetAsset` registry
- project-local source CSV/TSV/JSON/TXT/XLSX files
- native SQL tables as a separate derived-query surface

Python should receive the active project directory as its working directory and be able to resolve registered dataset source files by normal project-relative paths.

Do not create a second Python-only dataset registry.

## Dataset ergonomics

Python V1 should make common data work easy without hiding normal Python.

Target helpers/UI affordances:

- Datasets → `Open in Python` / `Create Python Analysis`
- generated starter code references the selected project-local asset safely
- dataset-aware completions can suggest known filenames/table metadata
- a DataFrame result can expose columns, row count, and a bounded preview in a structured native result surface
- generated CSV output can be registered back into Datasets through the same verified asset flow when the user chooses to save it

Generated helper code remains editable normal Python.

## Execution UX

### Run Selection

If editor text is selected, execute only that selection in the current Python session.

### Run File

With no selection, execute the active `.py` file.

### Console/output

Show:

- stdout in order
- stderr distinctly
- full useful traceback text for exceptions
- execution running/completed/failed state
- explicit reset/restart session control

Do not make the user open a separate web console surface.

### Persistence model

Within one project/session, repeated executions may share Python interpreter state if the selected runtime supports it reliably.

Switching projects must not leak variables, file paths, or dataset context across projects.

Relaunch does not need to serialize arbitrary Python memory. Source files and generated project assets are the persistence boundary.

## Structured DataFrame result

When the final expression/result is recognizably tabular, return a bounded native preview rather than only dumping `repr()` text.

Suggested metadata:

- column names
- inferred/display dtypes
- total row count when cheaply known
- first N preview rows
- truncation disclosure

The full DataFrame should not be copied into Swift memory merely to render a preview.

Saving/exporting a DataFrame should stream/write a project file and then use the Phase 2 dataset registry for reuse.

## Plot output

If plotting is included in the first Python checkpoint, keep the contract simple:

- Python produces a static image file in a temporary/project output location
- SwiftUI presents the image with Share/Save controls
- generated plot files are not automatically added to Datasets

Interactive desktop plotting is out of scope for V1.

## Error / resource behavior

Phase 3 must fail visibly and recoverably for:

- syntax errors
- runtime exceptions
- missing files
- missing/non-bundled packages
- runtime initialization failure
- memory pressure / terminated execution where detectable

A Python failure must not corrupt the project files or Phase 2 SQLite database.

## Phase 3 automated acceptance

Before the first Python phone checkpoint, native/runtime tests should cover as much of this as the embedded engine permits:

1. `print("hello")` returns stdout.
2. a syntax error returns a useful traceback/error.
3. sequential executions behave according to the documented session model.
4. active project working directory is correct.
5. Python can open the existing Orders CSV without copying it into another registry.
6. pandas reads Orders as 27 rows / 7 columns.
7. repeated values such as `C001` and `Starter Plan` remain unchanged.
8. a simple filter/group operation returns expected values.
9. generated CSV output can be registered as a normal DatasetAsset.
10. switching projects prevents runtime state/path leakage.

## First physical-device Python bundle

Do not build an IPA for each of these independently. Batch the first useful Python slice:

- runtime initialization
- Run Selection / Run File
- stdout/stderr/traceback UI
- project working-directory/file access
- pandas + Orders fixture read
- one structured DataFrame preview
- one save/export round trip
- project-switch isolation

Then make one native checkpoint and test the whole bundle on iPhone/iPad.

## Deferred from Phase 3 V1

- arbitrary `pip install` / package marketplace
- downloading Python wheels/runtime code on demand
- Jupyter notebook format/UI
- remote kernels
- debugger
- terminal/shell
- Git
- LSP server
- cloud execution
- PocketBI auth/billing integration
- R runtime implementation

R should be evaluated after the Python runtime path is stable enough to establish the reusable runtime/output architecture.

## Exit

Phase 3 is accepted when bIDE can perform a useful local analytics loop on physical hardware:

`project file → Python run → local dataset/DataFrame → structured result → saved/exported project asset`

without cloud dependency and without duplicating the Phase 2 project/data system.
