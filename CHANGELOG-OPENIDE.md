# OpenIDE – Change Log (Latest Patch)

Date: 2025-10-17

Summary: Addressed CSV flow issues, restored data grid preview alongside DataLab, and stabilized Python (Pyodide) package loading. Improved robustness on mobile.

1) CSV Experience
- CSV View Toggle: When a CSV is active, “View Data” now shows BOTH:
  - DatasetViewer (grid preview)
  - DataLab (profiling, target picker, AI suggestions)
- Auto-parse on selection: Opening a previously saved CSV re-parses content if dataset cache is missing. Uses Papa Parse for robust parsing; falls back to a naïve parser if needed.
- Code Insertion: While a CSV is selected, code snippets are inserted into the scratch editor and we auto-switch to “Write Code”. Avoids mutating the CSV file.

2) Python Runtime (Pyodide) – Package Loading
- Worker version pin: public/pyWorker.js now pins Pyodide to 0.28.3 (full build) to match app runtime expectations.
- indexURL override: The worker respects the indexURL sent during init, ensuring consistent CDN and version.
- Auto package preload: The worker scans user code for common imports (pandas, matplotlib, numpy, scipy, seaborn, statsmodels, scikit-learn, pyarrow) and loads them via pyodide.loadPackage before execution.
- DataLab snippet: The Python snippet now uses `await pyodide.loadPackage(['pandas','matplotlib'])` (no micropip required). This fixes the “ModuleNotFoundError: pandas” on iOS Safari.

3) DataLab Stability
- Target dropdown safety: Filters out empty/whitespace column names to prevent Radix Select runtime errors.
- Preloaded data sync: Re-worked preloadedData loader using a guarded useEffect (by filename) to avoid re-render loops and blank screen.

Known Issues / Next Steps
- Extremely large CSVs on iOS may hit memory limits; consider chunked preview or sampling server-side if needed.
- When working entirely offline on first load, package fetching may fail; consider a PWA pre-cache strategy for Pyodide packages.
- If a CSV has unusual delimiters (| or ;), add a delimiter auto-detection step or a per-file setting.

Files Modified
- src/pages/IDE.tsx
  - Run behavior when CSV is active: Run executes scratch code in “Write Code” mode.
  - CSV “View Data”: Renders DatasetViewer grid + DataLab.
  - Robust CSV parsing with Papa Parse; fallback retained.
  - Insert code targets scratch editor when a CSV is active.
  - Preloaded DataLab wiring stabilized using useMemo.
- src/components/DataLab.tsx
  - Python snippet switched to `pyodide.loadPackage` for pandas/matplotlib.
  - Target dropdown filters invalid column names.
  - Guarded useEffect for preloadedData to avoid loops.
- public/pyWorker.js
  - Pyodide pinned to v0.28.3 full; honors init indexURL.
  - Auto-detects imports and preloads required packages before run.

How to Validate
1. Upload or open a CSV from Past Files.
2. Click “View Data”: You should see the grid preview and the DataLab panel.
3. Click “Insert Cleaning & Plots (PYTHON)”, switch to “Write Code”, hit Run:
   - Console should log loading packages and run without pandas errors.
4. Use Target dropdown—no runtime errors when no/blank columns exist.

If issues persist, share the CSV sample and we’ll add a delimiter/quote auto-detection.
