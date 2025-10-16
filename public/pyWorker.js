// public/pyWorker.js — Final universal Pyodide worker with auto-retry, diagnostics, and Safari safety

self.onmessage = async (e) => {
  const msg = e.data;

  // Global retry flag to prevent infinite loops
  if (!self.retryAttempted) self.retryAttempted = false;

  // -------- INIT --------
  if (msg.type === 'init') {
    const { indexURL } = msg;

    // Fallback watchdog timer (15s)
    const watchdog = setTimeout(() => {
      self.postMessage({
        type: 'error',
        error: '[PyWorker] Init timeout (15s). Reloading...',
      });
      self.postMessage({ type: 'reload' });
      close();
    }, 15000);

    try {
      importScripts(`${indexURL}pyodide.js`);
      // eslint-disable-next-line no-undef
      const loadPyodide = self.loadPyodide;

      // Device & Browser Detection
      const ua = navigator.userAgent || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const disableThreads = isIOS || isSafari;

      // Log environment details
      self.postMessage({
        type: 'log',
        text: `[PyWorker] Initializing Pyodide...
Device: ${ua}
Threads disabled: ${disableThreads}
Retry attempt: ${self.retryAttempted}`,
      });

      // --- Pyodide Config ---
      const cfg = {
        indexURL,
        stdout: (t) => self.postMessage({ type: 'stdout', text: t }),
        stderr: (t) => self.postMessage({ type: 'stderr', text: t }),
        wasmMemory: new WebAssembly.Memory({ initial: 256, maximum: 256 }),
      };

      if (disableThreads) {
        delete self.SharedArrayBuffer; // remove unsupported feature for Safari
        cfg.args = ['--no-threading'];
        cfg.disableSharedMemory = true;
        cfg.disableWasmThreads = true;
        cfg.pthreadPoolSize = 0;
      }

      // eslint-disable-next-line no-undef
      self.pyodide = await loadPyodide(cfg);

      // eslint-disable-next-line no-undef
      await self.pyodide.loadPackage(['micropip']);

      clearTimeout(watchdog);
      self.postMessage({
        type: 'ready',
        text: `[PyWorker] Pyodide initialized successfully.
Threads disabled: ${disableThreads}`,
      });
      self.retryAttempted = false; // reset after success
    } catch (err) {
      clearTimeout(watchdog);
      const errMsg = err && err.message ? err.message : JSON.stringify(err);

      self.postMessage({
        type: 'error',
        error: 'Init failed: ' + errMsg,
      });

      // --- Auto-Retry Logic ---
      if (
        !self.retryAttempted &&
        /exit\(2\)/i.test(errMsg) // detect the specific crash
      ) {
        self.retryAttempted = true;
        self.postMessage({
          type: 'log',
          text: '[PyWorker] Detected exit(2) crash — retrying once...',
        });
        setTimeout(() => {
          self.postMessage({ type: 'reload' });
          close(); // terminate this worker so the main thread can restart
        }, 1000);
      } else {
        self.postMessage({
          type: 'error',
          error: '[PyWorker] Initialization failed permanently: ' + errMsg,
        });
      }
    }
    return;
  }

  // -------- RUN PYTHON --------
  if (msg.type === 'run' && self.pyodide) {
    try {
      // eslint-disable-next-line no-undef
      const result = await self.pyodide.runPythonAsync(msg.code);
      self.postMessage({ type: 'result', result });
    } catch (err) {
      self.postMessage({ type: 'error', error: String(err) });
    }
    return;
  }

  // -------- INSTALL PACKAGE --------
  if (msg.type === 'install' && self.pyodide) {
    try {
      // eslint-disable-next-line no-undef
      await self.pyodide.runPythonAsync(`
import micropip
await micropip.install("${msg.name}")
`);
      self.postMessage({
        type: 'installed',
        name: msg.name,
        text: `[PyWorker] Installed package: ${msg.name}`,
      });
    } catch (err) {
      self.postMessage({ type: 'error', error: String(err) });
    }
    return;
  }
};
