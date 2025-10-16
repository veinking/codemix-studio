// Pyodide Web Worker - runs off main thread for better iOS/Safari compatibility
let pyodide: any = null;

type Msg =
  | { type: 'init'; indexURL: string; mobile: boolean }
  | { type: 'run'; code: string }
  | { type: 'install'; name: string };

self.onmessage = async (evt: MessageEvent<Msg>) => {
  const msg = evt.data;

  try {
    if (msg.type === 'init') {
      // Dynamically import the npm module for the same version pinned in package.json
      const mod = await import('pyodide');
      const loadPyodide = (mod as any).loadPyodide;

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
