// ============================================================
//  SAFARI-SAFE PYODIDE WORKER
//  Uses core-mini build to prevent memory crashes
//  Classic import mode for maximum compatibility
// ============================================================

const PYODIDE_BASE = "https://cdn.jsdelivr.net/pyodide/v0.24.1/core/";

let pyodide = null;
let isInitializing = false;

// === Safari-safe Pyodide Loader ===
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
      text: `[PyWorker] Initializing Pyodide v0.24.1 (core build)
Device: ${navigator.userAgent}`,
    });

    // Classic mode import for Safari; prevents "importScripts with module" error
    importScripts(`${PYODIDE_BASE}pyodide.js`);
    // eslint-disable-next-line no-undef
    const loadPyodide = self.loadPyodide;

    // eslint-disable-next-line no-undef
    pyodide = await loadPyodide({
      indexURL: PYODIDE_BASE,
      stdout: (t) => self.postMessage({ type: "stdout", text: t }),
      stderr: (t) => self.postMessage({ type: "stderr", text: t }),
    });

    self.pyodide = pyodide;
    self.postMessage({ 
      type: "ready",
      text: "✅ Pyodide initialized (core-mini build)"
    });
    console.log("✅ Pyodide initialized (core-mini build)");
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
