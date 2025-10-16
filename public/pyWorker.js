// ============================================================
//  SAFARI-COMPATIBLE PYODIDE WORKER (FINAL STABLE)
//  Uses Safari-safe CDN URLs with automatic fallback
// ============================================================

let pyodide = null;
let isInitializing = false;

const PYODIDE_URLS = [
  // Primary CDN (fast, Safari-compatible)
  "https://cdn.jsdelivr.net/npm/pyodide@0.24.1/",
  // Backup CDN (always CORS-safe)
  "https://pyodide-cdn2.iodide.io/v0.24.1/",
];

// === Try loading from a specific CDN ===
async function tryLoadPyodide(url) {
  try {
    self.postMessage({
      type: "log",
      text: `[PyWorker] Attempting to load from ${url}`,
    });

    importScripts(`${url}pyodide.js`);
    // eslint-disable-next-line no-undef
    const loadPyodide = self.loadPyodide;

    // eslint-disable-next-line no-undef
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
      text: `[PyWorker] Initializing Pyodide with retry logic
Device: ${navigator.userAgent}`,
    });

    // Try each CDN URL until one succeeds
    for (const url of PYODIDE_URLS) {
      const loaded = await tryLoadPyodide(url);
      if (loaded) {
        pyodide = loaded;
        self.pyodide = pyodide;
        self.postMessage({ 
          type: "ready",
          text: `✅ Pyodide initialized successfully`
        });
        console.log("✅ Pyodide initialized (Safari-safe build)");
        isInitializing = false;
        return pyodide;
      }
    }

    // If all URLs failed
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
    
    if (!pyodide.loadedPackages[pkg]) {
      self.postMessage({
        type: "log",
        text: `📦 Loading package: ${pkg}`,
      });
      await pyodide.loadPackage(pkg);
      self.postMessage({
        type: "log",
        text: `✅ Loaded package: ${pkg}`,
      });
    }
  } catch (e) {
    console.warn(`Could not load ${pkg}:`, e);
    self.postMessage({
      type: "log",
      text: `⚠️ Could not load ${pkg}: ${String(e)}`,
    });
  }
}

// === Message Handler ===
self.onmessage = async (e) => {
  const msg = e.data;

  // =============== INIT ===============
  if (msg.type === "init") {
    await initPyodideSafe();
    return;
  }

  // =============== RUN PYTHON ===============
  if (msg.type === "run") {
    try {
      await initPyodideSafe();
      await ensurePackage("micropip");
      // eslint-disable-next-line no-undef
      const result = await pyodide.runPythonAsync(msg.code);
      self.postMessage({ type: "result", result });
    } catch (err) {
      self.postMessage({ type: "error", error: String(err) });
    }
    return;
  }

  // =============== INSTALL PACKAGE ===============
  if (msg.type === "install") {
    try {
      await initPyodideSafe();
      await ensurePackage("micropip");
      // eslint-disable-next-line no-undef
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
};
