// public/pyWorker.js — Safari/iOS-safe Pyodide worker with diagnostics

self.onmessage = async (e) => {
  const msg = e.data;

  // -------- INIT --------
  if (msg.type === 'init') {
    const { indexURL } = msg;

    try {
      importScripts(`${indexURL}pyodide.js`);
      // eslint-disable-next-line no-undef
      const loadPyodide = self.loadPyodide;

      // Device & browser detection
      const ua = navigator.userAgent || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const disableThreads = isIOS || isSafari;

      // Diagnostic logs
      self.postMessage({
        type: 'log',
        text: `[PyWorker] Initializing Pyodide...
Device: ${ua}
Threads disabled: ${disableThreads}`,
      });

      const cfg = {
        indexURL,
        stdout: (t) => self.postMessage({ type: 'stdout', text: t }),
        stderr: (t) => self.postMessage({ type: 'stderr', text: t }),
      };

      if (disableThreads) {
        cfg.args = ['--no-threading'];
        cfg.disableSharedMemory = true;
        cfg.disableWasmThreads = true;
      }

      // eslint-disable-next-line no-undef
      self.pyodide = await loadPyodide(cfg);

      // Preload micropip
      // eslint-disable-next-line no-undef
      await self.pyodide.loadPackage(['micropip']);

      self.postMessage({
        type: 'ready',
        text: `[PyWorker] Pyodide initialized successfully.
Threads disabled: ${disableThreads}`,
      });
    } catch (err) {
      self.postMessage({
        type: 'error',
        error:
          'Init failed: ' +
          (err && err.message ? err.message : JSON.stringify(err)),
      });
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
