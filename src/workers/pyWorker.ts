// Pyodide Web Worker - runs off main thread for better iOS/Safari compatibility
// This is a CLASSIC worker (not module) to support importScripts()

/// <reference lib="webworker" />

let pyodide: any = null;

// Message handler
self.onmessage = async (evt: MessageEvent) => {
  const msg = evt.data;

  try {
    if (msg.type === 'init') {
      // Load Pyodide v0.28.3 from CDN using importScripts
      const PYODIDE_VERSION = '0.28.3';
      const cdnUrl = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`;
      
      console.log('[PyWorker] Loading Pyodide from CDN:', cdnUrl);
      
      // importScripts works in classic workers only
      importScripts(cdnUrl);
      
      // Access the global loadPyodide function injected by the script
      const loadPyodide = (self as any).loadPyodide;
      
      if (!loadPyodide) {
        throw new Error('Failed to load Pyodide from CDN - loadPyodide not found');
      }

      const cfg: any = {
        indexURL: msg.indexURL,
        stdout: (t: string) => self.postMessage({ type: 'stdout', text: t }),
        stderr: (t: string) => self.postMessage({ type: 'stderr', text: t }),
      };
      
      if (msg.mobile) {
        cfg.args = ['--no-threading'];
      }

      console.log('[PyWorker] Initializing Pyodide with indexURL:', msg.indexURL);
      pyodide = await loadPyodide(cfg);
      
      console.log('[PyWorker] Loading Python packages...');
      await pyodide.loadPackage(['micropip', 'numpy', 'pandas']);
      
      self.postMessage({ type: 'ready' });
      console.log('[PyWorker] Pyodide ready');
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
