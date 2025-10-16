// ============================================================
//  UNIVERSAL PYODIDE WORKER
//  Supports Desktop, Android, and iOS Safari seamlessly
//  Version auto-switcher + diagnostics + retry logic
// ============================================================

self.onmessage = async (e) => {
  const msg = e.data;
  if (!self.retryAttempted) self.retryAttempted = false;

  // =============== INIT ===============
  if (msg.type === "init") {
    const { indexURL } = msg;

    const watchdog = setTimeout(() => {
      self.postMessage({
        type: "error",
        error: "[PyWorker] Init timeout (15s). Reloading...",
      });
      self.postMessage({ type: "reload" });
      close();
    }, 15000);

    try {
      // --- Detect device/browser ---
      const ua = navigator.userAgent || "";
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const disableThreads = isIOS || isSafari;

      // --- Choose Pyodide version ---
      const pyVersion = disableThreads ? "0.24.1" : "0.28.3";
      const pyodideURL = `https://cdn.jsdelivr.net/pyodide/v${pyVersion}/full/pyodide.js`;

      // --- Load Pyodide dynamically ---
      importScripts(pyodideURL);
      // eslint-disable-next-line no-undef
      const loadPyodide = self.loadPyodide;

      // --- Log environment ---
      self.postMessage({
        type: "log",
        text: `[PyWorker] Initializing Pyodide v${pyVersion}
Device: ${ua}
Threads disabled: ${disableThreads}
Retry attempt: ${self.retryAttempted}`,
      });

      // --- Pyodide Config ---
      const cfg = {
        indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyVersion}/full/`,
        stdout: (t) => self.postMessage({ type: "stdout", text: t }),
        stderr: (t) => self.postMessage({ type: "stderr", text: t }),
        pyodideMemoryLimit: 256, // Limit memory to avoid iOS crashes
      };

      if (disableThreads) {
        delete self.SharedArrayBuffer;
        cfg.args = ["--no-threading"];
        cfg.disableSharedMemory = true;
        cfg.disableWasmThreads = true;
        cfg.pthreadPoolSize = 0;
      }

      // --- Load Pyodide ---
      // eslint-disable-next-line no-undef
      self.pyodide = await loadPyodide(cfg);
      // eslint-disable-next-line no-undef
      await self.pyodide.loadPackage(["micropip"]);

      clearTimeout(watchdog);
      self.retryAttempted = false;
      self.postMessage({
        type: "ready",
        text: `[PyWorker] Pyodide ${pyVersion} initialized successfully.`,
      });
    } catch (err) {
      clearTimeout(watchdog);
      const errMsg = err && err.message ? err.message : JSON.stringify(err);

      self.postMessage({
        type: "error",
        error: "[PyWorker] Init failed: " + errMsg,
      });

      // --- Auto-retry logic for exit(2) ---
      if (!self.retryAttempted && /exit\(2\)/i.test(errMsg)) {
        self.retryAttempted = true;
        self.postMessage({
          type: "log",
          text: "[PyWorker] Detected exit(2) crash — retrying once...",
        });
        setTimeout(() => {
          self.postMessage({ type: "reload" });
          close();
        }, 1000);
      } else {
        self.postMessage({
          type: "error",
          error: "[PyWorker] Initialization failed permanently: " + errMsg,
        });
      }
    }
    return;
  }

  // =============== RUN PYTHON ===============
  if (msg.type === "run" && self.pyodide) {
    try {
      // eslint-disable-next-line no-undef
      const result = await self.pyodide.runPythonAsync(msg.code);
      self.postMessage({ type: "result", result });
    } catch (err) {
      self.postMessage({ type: "error", error: String(err) });
    }
    return;
  }

  // =============== INSTALL PACKAGE ===============
  if (msg.type === "install" && self.pyodide) {
    try {
      // eslint-disable-next-line no-undef
      await self.pyodide.runPythonAsync(`
import micropip
await micropip.install("${msg.name}")
`);
      self.postMessage({
        type: "installed",
        name: msg.name,
        text: `[PyWorker] Installed package: ${msg.name}`,
      });
    } catch (err) {
      self.postMessage({ type: "error", error: String(err) });
    }
    return;
  }
};
