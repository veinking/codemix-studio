// ============================================================
//  SAFARI-COMPATIBLE PYODIDE WORKER (FINAL STABLE)
//  Uses Safari-safe CDN URLs with automatic fallback
// ============================================================

let pyodide = null;
let isInitializing = false;

const PYODIDE_URLS = [
  // Primary CDN (pin to 0.28.3 full build)
  "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/",
];

// === Try loading from a specific CDN ===
async function tryLoadPyodide(url) {
  try {
    self.postMessage({
      type: "log",
      text: `[PyWorker] Attempting to load from ${url}`,
    });

    importScripts(`${url}pyodide.js`);
    const loadPyodide = self.loadPyodide;

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
let INDEX_OVERRIDE = null;
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
      text: `[PyWorker] Initializing Pyodide with retry logic\nDevice: ${navigator.userAgent}`,
    });

    const sources = INDEX_OVERRIDE ? [INDEX_OVERRIDE, ...PYODIDE_URLS] : PYODIDE_URLS;

    // Try each CDN URL until one succeeds
    for (const url of sources) {
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
    
    // Packages available via pyodide.loadPackage (built-in)
    const builtInPackages = new Set(['numpy', 'pandas', 'matplotlib', 'scipy', 'scikit-learn', 'pyarrow']);
    
    // Packages that need micropip installation
    const micropipPackages = new Set(['seaborn', 'statsmodels', 'plotly', 'beautifulsoup4']);
    
    if (builtInPackages.has(pkg)) {
      // Use built-in loader
      if (!pyodide.loadedPackages[pkg]) {
        self.postMessage({ type: "log", text: `📦 Loading package: ${pkg}` });
        await pyodide.loadPackage(pkg);
        self.postMessage({ type: "log", text: `✅ Loaded package: ${pkg}` });
      }
    } else if (micropipPackages.has(pkg)) {
      // Use micropip for packages not in built-in set
      await ensurePackage('micropip');
      if (!pyodide.loadedPackages['micropip']) {
        await pyodide.loadPackage('micropip');
      }
      
      self.postMessage({ type: "log", text: `📦 Installing via micropip: ${pkg}` });
      await pyodide.runPythonAsync(`
import micropip
await micropip.install("${pkg}")
      `);
      self.postMessage({ type: "log", text: `✅ Installed package: ${pkg}` });
    }
  } catch (e) {
    console.warn(`Could not load ${pkg}:`, e);
    self.postMessage({ type: "log", text: `⚠️ Could not load ${pkg}: ${String(e)}` });
  }
}

// === Message Handler ===
self.onmessage = async (e) => {
  const msg = e.data;

  // =============== INIT ===============
  if (msg.type === "init") {
    if (msg.indexURL) INDEX_OVERRIDE = msg.indexURL;
    await initPyodideSafe();
    return;
  }

  // Helper: detect imports and map to Pyodide package names
  const detectRequiredPackages = (code) => {
    const pkgs = new Set();
    const add = (name) => name && pkgs.add(name);

    const lines = String(code).split(/\n|;/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      // import x as y, import x, y
      const m1 = line.match(/^import\s+([^#]+)/);
      if (m1) {
        const names = m1[1].split(',').map(s => s.trim().split(' as ')[0]);
        for (let n of names) {
          if (n.startsWith('matplotlib')) add('matplotlib');
          else if (n === 'sklearn') add('scikit-learn');
          else if (n === 'bs4') add('beautifulsoup4');
          else if (n === 'cv2') add('opencv-python');
          else add(n);
        }
        continue;
      }
      // from x import y
      const m2 = line.match(/^from\s+([\w\.]+)\s+import\s+/);
      if (m2) {
        let base = m2[1];
        if (base.startsWith('matplotlib')) base = 'matplotlib';
        if (base === 'sklearn') base = 'scikit-learn';
        add(base.split('.')[0]);
        continue;
      }
    }

    // Only keep packages that Pyodide can load directly (common data-science set)
    const supported = new Set([
      'numpy','pandas','matplotlib','seaborn','scipy','statsmodels','scikit-learn','pyarrow'
    ]);
    return Array.from(pkgs).filter(p => supported.has(p));
  };

  // =============== RUN PYTHON ===============
  if (msg.type === "run") {
    try {
      await initPyodideSafe();
      // Preload common packages if required by the code
      const required = detectRequiredPackages(msg.code);
      for (const pkg of required) {
        await ensurePackage(pkg);
      }
      
      // Special handling for plotting code - ensure matplotlib is fully ready
      if (msg.code.includes('matplotlib') || msg.code.includes('plt.')) {
        await ensurePackage('matplotlib');
        // Extended delay for mobile Safari memory management
        if (msg.isMobile) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      
      const result = await pyodide.runPythonAsync(msg.code);
      self.postMessage({ type: "result", result });
    } catch (err) {
      // Enhanced error messages for plotting issues
      let errorMsg = String(err);
      if (errorMsg.includes('matplotlib') || errorMsg.includes('savefig')) {
        errorMsg = `⚠️ Plot rendering error: ${errorMsg}\n\n💡 Tip: The plot code is valid but image capture failed. You can save this code and run it in a local Python environment.`;
      }
      self.postMessage({ type: "error", error: errorMsg });
    }
    return;
  }

  // =============== INSTALL PACKAGE ===============
  if (msg.type === "install") {
    try {
      await initPyodideSafe();
      await ensurePackage("micropip");
      await pyodide.runPythonAsync(`\nimport micropip\nawait micropip.install("${msg.name}")\n`);
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

  // =============== WRITE CSV TO VIRTUAL FS ===============
  if (msg.type === "writeCSV") {
    try {
      await initPyodideSafe();
      const { filename, content } = msg;
      
      // Write file to Pyodide's virtual filesystem
      pyodide.FS.writeFile(filename, content);
      
      self.postMessage({ 
        type: "csv-written", 
        filename,
        text: `CSV written to virtual FS: ${filename}` 
      });
      self.postMessage({ type: "log", text: `[Worker] Wrote ${filename} (${content.length} bytes)` });
    } catch (err) {
      self.postMessage({ type: "error", error: String(err) });
    }
    return;
  }
};
