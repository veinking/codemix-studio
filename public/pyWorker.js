// ============================================================
//  SAFARI-COMPATIBLE PYODIDE WORKER
//  Uses Safari-safe CDN URLs with automatic fallback.
//  Matplotlib is forced onto a worker-safe Agg backend and
//  figures are captured as PNG data URLs for the Plot Viewer.
// ============================================================

let pyodide = null;
let isInitializing = false;
let managedCsvFiles = new Set();

const PYODIDE_URLS = [
  // Primary CDN (pin to 0.28.3 full build)
  "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/",
];

// === Try loading from a specific CDN ===
async function tryLoadPyodide(url) {
  try {
    self.postMessage({
      type: "log",
      text: `[PyWorker] Attempting to load from ${url}`,
    });

    importScripts(`${url}pyodide.js`);
    const loadPyodide = self.loadPyodide;

    const pyodideInstance = await loadPyodide({
      indexURL: url,
      stdout: (t) => self.postMessage({ type: "stdout", text: t }),
      stderr: (t) => self.postMessage({ type: "stderr", text: t }),
    });

    self.postMessage({
      type: "log",
      text: `✅ Pyodide initialized from ${url}`,
    });

    return pyodideInstance;
  } catch (e) {
    console.warn(`❌ Pyodide load failed from ${url}:`, e);
    self.postMessage({
      type: "log",
      text: `⚠️ Failed to load from ${url}: ${String(e)}`,
    });
    return null;
  }
}

// === Safari-safe Pyodide Loader with Retry ===
let INDEX_OVERRIDE = null;
async function initPyodideSafe() {
  if (pyodide) return pyodide;
  if (isInitializing) {
    // Wait for ongoing initialization
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return pyodide;
  }

  isInitializing = true;

  try {
    self.postMessage({
      type: "log",
      text: `[PyWorker] Initializing Pyodide with retry logic\nDevice: ${navigator.userAgent}`,
    });

    const sources = INDEX_OVERRIDE ? [INDEX_OVERRIDE, ...PYODIDE_URLS] : PYODIDE_URLS;

    // Try each CDN URL until one succeeds
    for (const url of sources) {
      const loaded = await tryLoadPyodide(url);
      if (loaded) {
        pyodide = loaded;
        self.pyodide = pyodide;
        self.postMessage({
          type: "ready",
          text: `✅ Pyodide initialized successfully`,
        });
        console.log("✅ Pyodide initialized (Safari-safe build)");
        isInitializing = false;
        return pyodide;
      }
    }

    throw new Error("All Pyodide CDN sources failed to load.");
  } catch (err) {
    console.error("Pyodide init error:", err);
    self.postMessage({
      type: "error",
      error: "Safari-safe init failed: " + String(err),
    });
  } finally {
    isInitializing = false;
  }

  return pyodide;
}

// === Lazy Package Loader ===
async function ensurePackage(pkg) {
  try {
    if (!pyodide) await initPyodideSafe();
    if (!pyodide) throw new Error("Pyodide not initialized");

    const builtInPackages = new Set([
      "numpy",
      "pandas",
      "matplotlib",
      "scipy",
      "scikit-learn",
      "pyarrow",
    ]);

    const micropipPackages = new Set([
      "seaborn",
      "statsmodels",
      "plotly",
      "beautifulsoup4",
    ]);

    if (builtInPackages.has(pkg)) {
      if (!pyodide.loadedPackages[pkg]) {
        self.postMessage({ type: "log", text: `📦 Loading package: ${pkg}` });
        await pyodide.loadPackage(pkg);
        self.postMessage({ type: "log", text: `✅ Loaded package: ${pkg}` });
      }
    } else if (micropipPackages.has(pkg)) {
      if (!pyodide.loadedPackages.micropip) {
        await pyodide.loadPackage("micropip");
      }

      self.postMessage({ type: "log", text: `📦 Installing via micropip: ${pkg}` });
      await pyodide.runPythonAsync(`
import micropip
await micropip.install("${pkg}")
      `);
      self.postMessage({ type: "log", text: `✅ Installed package: ${pkg}` });
    }
  } catch (e) {
    console.warn(`Could not load ${pkg}:`, e);
    self.postMessage({ type: "log", text: `⚠️ Could not load ${pkg}: ${String(e)}` });
  }
}

const codeLikelyCreatesPlot = (code) => {
  const source = String(code);
  return (
    source.includes("matplotlib") ||
    source.includes("plt.") ||
    source.includes("seaborn") ||
    source.includes("sns.") ||
    /\.plot\s*\(/.test(source)
  );
};

// Matplotlib's browser/DOM backends cannot run inside a Web Worker because
// there is no document/window. Force a headless raster backend before pyplot
// is imported, and make plt.show() a no-op so normal notebook-style code works.
async function prepareMatplotlibForWorker() {
  await ensurePackage("matplotlib");
  await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use("Agg", force=True)
import matplotlib.pyplot as _bide_plt
_bide_plt.close("all")

def _bide_worker_show(*args, **kwargs):
    return None

_bide_plt.show = _bide_worker_show
  `);
}

// Capture every open Matplotlib figure after the user's code completes.
// Each figure is serialized as a PNG data URL and returned to the main thread.
async function captureMatplotlibPlots() {
  const serialized = await pyodide.runPythonAsync(`
import base64
import io
import json
import matplotlib.pyplot as _bide_plt

_bide_plot_urls = []
for _bide_figure_number in _bide_plt.get_fignums():
    _bide_figure = _bide_plt.figure(_bide_figure_number)
    _bide_buffer = io.BytesIO()
    _bide_figure.savefig(_bide_buffer, format="png", bbox_inches="tight")
    _bide_buffer.seek(0)
    _bide_encoded = base64.b64encode(_bide_buffer.read()).decode("ascii")
    _bide_plot_urls.append("data:image/png;base64," + _bide_encoded)
    _bide_buffer.close()

_bide_plt.close("all")
json.dumps(_bide_plot_urls)
  `);

  const plotUrls = JSON.parse(String(serialized || "[]"));
  for (const dataUrl of plotUrls) {
    self.postMessage({ type: "plot", dataUrl });
  }
  return plotUrls.length;
}

// Helper: detect imports and map to Pyodide package names
const detectRequiredPackages = (code) => {
  const pkgs = new Set();
  const add = (name) => name && pkgs.add(name);

  const lines = String(code).split(/\n|;/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const m1 = line.match(/^import\s+([^#]+)/);
    if (m1) {
      const names = m1[1].split(",").map(s => s.trim().split(" as ")[0]);
      for (const n of names) {
        if (n.startsWith("matplotlib")) add("matplotlib");
        else if (n === "sklearn") add("scikit-learn");
        else if (n === "bs4") add("beautifulsoup4");
        else if (n === "cv2") add("opencv-python");
        else add(n);
      }
      continue;
    }

    const m2 = line.match(/^from\s+([\w\.]+)\s+import\s+/);
    if (m2) {
      let base = m2[1];
      if (base.startsWith("matplotlib")) base = "matplotlib";
      if (base === "sklearn") base = "scikit-learn";
      add(base.split(".")[0]);
    }
  }

  const supported = new Set([
    "numpy",
    "pandas",
    "matplotlib",
    "seaborn",
    "scipy",
    "statsmodels",
    "scikit-learn",
    "pyarrow",
  ]);
  return Array.from(pkgs).filter(p => supported.has(p));
};

// === Message Handler ===
self.onmessage = async (e) => {
  const msg = e.data;

  // =============== INIT ===============
  if (msg.type === "init") {
    if (msg.indexURL) INDEX_OVERRIDE = msg.indexURL;
    await initPyodideSafe();
    return;
  }

  // =============== RUN PYTHON ===============
  if (msg.type === "run") {
    try {
      await initPyodideSafe();
      if (!pyodide) throw new Error("Pyodide not initialized");

      const required = detectRequiredPackages(msg.code);
      for (const pkg of required) {
        await ensurePackage(pkg);
      }

      const shouldCapturePlots = codeLikelyCreatesPlot(msg.code);
      if (shouldCapturePlots) {
        await prepareMatplotlibForWorker();
        if (msg.isMobile) {
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }

      const result = await pyodide.runPythonAsync(msg.code);

      if (shouldCapturePlots) {
        await captureMatplotlibPlots();
      }

      self.postMessage({ type: "result", result });
    } catch (err) {
      let errorMsg = String(err);
      if (
        errorMsg.includes("matplotlib") ||
        errorMsg.includes("savefig") ||
        errorMsg.includes("cannot import name 'document' from 'js'")
      ) {
        errorMsg = `⚠️ Plot rendering error: ${errorMsg}\n\nThe browser runtime could not render this figure. Please retry; bIDE plots are expected to run in-browser.`;
      }
      self.postMessage({ type: "error", error: errorMsg });
    }
    return;
  }

  // =============== INSTALL PACKAGE ===============
  if (msg.type === "install") {
    try {
      await initPyodideSafe();
      if (!pyodide) throw new Error("Pyodide not initialized");
      if (!pyodide.loadedPackages.micropip) {
        await pyodide.loadPackage("micropip");
      }
      await pyodide.runPythonAsync(`
import micropip
await micropip.install("${msg.name}")
      `);
      self.postMessage({
        type: "installed",
        name: msg.name,
        text: `✅ Installed package: ${msg.name}`,
      });
    } catch (err) {
      self.postMessage({ type: "error", error: String(err) });
    }
    return;
  }

  // =============== SYNC WORKSPACE CSV FILES ===============
  if (msg.type === "syncCSVs") {
    try {
      await initPyodideSafe();
      if (!pyodide) throw new Error("Pyodide not initialized");

      const files = Array.isArray(msg.files) ? msg.files : [];
      const nextNames = new Set(files.map(file => file.name));

      for (const oldName of managedCsvFiles) {
        if (nextNames.has(oldName)) continue;
        try {
          pyodide.FS.unlink(oldName);
        } catch {
          // The VFS may already have been reset or the file removed manually.
        }
      }

      for (const file of files) {
        pyodide.FS.writeFile(file.name, file.content);
      }

      managedCsvFiles = nextNames;
      self.postMessage({
        type: "csv-sync-complete",
        files: [...nextNames],
      });
    } catch (err) {
      self.postMessage({ type: "error", error: String(err) });
    }
    return;
  }

  // =============== WRITE CSV TO VIRTUAL FS ===============
  if (msg.type === "writeCSV") {
    try {
      await initPyodideSafe();
      if (!pyodide) throw new Error("Pyodide not initialized");
      const { filename, content } = msg;

      pyodide.FS.writeFile(filename, content);

      self.postMessage({
        type: "csv-written",
        filename,
        text: `CSV written to virtual FS: ${filename}`,
      });
      self.postMessage({ type: "log", text: `[Worker] Wrote ${filename} (${content.length} bytes)` });
    } catch (err) {
      self.postMessage({ type: "error", error: String(err) });
    }
  }
};
