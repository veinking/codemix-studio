// Pyodide Web Worker - runs off main thread for better iOS/Safari compatibility
// This is a CLASSIC worker (not module) to support importScripts()

/// <reference lib="webworker" />

let pyodide: any = null;

// Message handler
self.onmessage = async (evt: MessageEvent) => {
  const msg = evt.data;

  try {
    if (msg.type === 'init') {
      const { indexURL } = msg;

      let loadPyodide: any;
      try {
        // Try NPM import first
        const mod = await import('pyodide');
        loadPyodide = (mod as any).loadPyodide;
      } catch {
        // Fallback to CDN script if import fails
        importScripts(`${indexURL}pyodide.js`);
        // @ts-ignore
        loadPyodide = self.loadPyodide;
      }

      // --- Safari / iOS detection ---
      const ua = navigator.userAgent || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const disableThreads = isIOS || isSafari;

      const cfg: any = {
        indexURL,
        stdout: (t: string) => self.postMessage({ type: 'stdout', text: t }),
        stderr: (t: string) => self.postMessage({ type: 'stderr', text: t }),
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
      } catch (err: any) {
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
  } catch (err: any) {
    console.error('[PyWorker] Error:', err);
    self.postMessage({ type: 'error', error: String(err?.message || err) });
  }
};
