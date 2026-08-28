import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    console.error(`CSV workspace regression: ${message}`);
    process.exit(1);
  }
};

const ide = read('src/pages/IDE.tsx');
const runtime = read('src/runtimes/PythonRuntime.ts');
const worker = read('public/pyWorker.js');

assert(ide.includes('Back to IDE'), 'CSV source context must have a direct exit to the scratch IDE');
assert(ide.includes("language === 'python' && runtime instanceof PythonRuntime"), 'normal Python runs must use the Python runtime workspace sync');
assert(ide.includes("scratchLanguage === 'python' && runtime instanceof PythonRuntime"), 'Python notebook cells must use the same workspace sync');
assert(ide.includes('Python workspace CSVs refreshed:'), 'users must get visible confirmation that workspace CSVs were prepared');
assert(!ide.includes("const csvPattern = /pd\\.read_csv"), 'Python CSV availability must not depend on detecting one pandas call shape');
assert(!ide.includes('Wrote ${fileName} to Pyodide FS'), 'CSV preview parsing must not own Python VFS state');
assert(runtime.includes('async syncCSVFiles(files: WorkspaceCSVFile[])'), 'PythonRuntime must expose authoritative CSV workspace sync');
assert(runtime.includes("type: 'syncCSVs'"), 'PythonRuntime must request atomic workspace refresh from the worker');
assert(worker.includes('let managedCsvFiles = new Set();'), 'worker must track managed CSV files');
assert(worker.includes('if (msg.type === "syncCSVs")'), 'worker must implement workspace CSV sync');
assert(worker.includes('pyodide.FS.unlink(oldName)'), 'worker must remove deleted workspace CSVs instead of leaving stale files');
assert(worker.includes('type: "csv-sync-complete"'), 'worker must acknowledge completed workspace sync');

console.log('CSV workspace access regression checks passed.');
