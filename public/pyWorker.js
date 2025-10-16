// Pyodide Web Worker - Classic worker loaded as external script
// This file is NOT bundled by Vite to avoid code-splitting issues

let pyodide = null;

self.onmessage = async (evt) => {
  const msg = evt.data;

  try {
    if (msg.type === 'init') {
      const { indexURL } = msg;

      // Load Pyodide from CDN using importScripts (classic worker only)
      self.importScripts(indexURL + 'pyodide.js');
      
      const loadPyodide = self.loadPyodide;
      
      if (!loadPyodide) {
        throw new Error('Failed to load Pyodide - loadPyodide not found on global scope');
      }

      // Safari / iOS detection
      const ua = navigator.userAgent || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const disableThreads = isIOS || isSafari;

      const cfg = {
        indexURL: indexURL,
        stdout: (t) => self.postMessage({ type: 'stdout', text: t }),
        stderr: (t) => self.postMessage({ type: 'stderr', text: t }),
      };

      if (disableThreads) {
        cfg.args = ['--no-threading'];
        cfg.disableSharedMemory = true;
        cfg.disableWasmThreads = true;
      }

      try {
        pyodide = await loadPyodide(cfg);
        await pyodide.loadPackage(['micropip']);
        self.postMessage({ type: 'ready' });
      } catch (err) {
        self.postMessage({ type: 'error', error: 'Init failed: ' + err.message });
      }
      return;
    }

    if (!pyodide) {
      throw new Error('Pyodide not initialized');
    }

    if (msg.type === 'run') {
      const result = await pyodide.runPythonAsync(msg.code);
      self.postMessage({ type: 'result', result });
      return;
    }

    if (msg.type === 'install') {
      await pyodide.runPythonAsync(`
import micropip
await micropip.install("${msg.name}")
`);
      self.postMessage({ type: 'installed', name: msg.name });
      return;
    }
  } catch (err) {
    console.error('[PyWorker] Error:', err);
    self.postMessage({ type: 'error', error: String(err?.message || err) });
  }
};
