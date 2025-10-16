// pyWorker.js — fully Safari-safe Pyodide worker

// No top-level await allowed in classic workers
self.onmessage = async (e) => {
  const msg = e.data;

  if (msg.type === 'init') {
    const { indexURL } = msg;

    try {
      // Load Pyodide from CDN (safe for classic worker)
      importScripts(`${indexURL}pyodide.js`);
      // @ts-ignore
      const loadPyodide = self.loadPyodide;

      // Safari detection
      const ua = navigator.userAgent || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const disableThreads = isIOS || isSafari;

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

      // Initialize Pyodide
      // @ts-ignore
      self.pyodide = await loadPyodide(cfg);

      // Preload micropip for package installs
      // @ts-ignore
      await self.pyodide.loadPackage(['micropip']);

      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({
        type: 'error',
        error: 'Init failed: ' + (err.message || err),
      });
    }
  }

  if (msg.type === 'run' && self.pyodide) {
    try {
      // @ts-ignore
      const result = await self.pyodide.runPythonAsync(msg.code);
      self.postMessage({ type: 'result', result });
    } catch (err) {
      self.postMessage({ type: 'error', error: String(err) });
    }
  }

  if (msg.type === 'install' && self.pyodide) {
    try {
      // @ts-ignore
      await self.pyodide.runPythonAsync(`
import micropip
await micropip.install("${msg.name}")
`);
      self.postMessage({ type: 'installed', name: msg.name });
    } catch (err) {
      self.postMessage({ type: 'error', error: String(err) });
    }
  }
};
