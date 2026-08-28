from pathlib import Path
import json


def read(path):
    return Path(path).read_text()


def write(path, content):
    Path(path).write_text(content)


def require_once(text, needle, label):
    count = text.count(needle)
    if count != 1:
        raise SystemExit(f"Expected exactly one {label}; found {count}")


ide_path = "src/pages/IDE.tsx"
ide = read(ide_path)

# Python CSV access must be authoritative from the persisted workspace, not from
# whichever CSV previews happen to have been opened in this browser session.
legacy_start = "    // If Python runtime, check for CSV references and write them to virtual FS\n"
legacy_end = "    // Show loading toast for seaborn (first-time install takes ~10 seconds)\n"
require_once(ide, legacy_start, "legacy Python CSV prep block")
start = ide.index(legacy_start)
end = ide.index(legacy_end, start)
python_sync_block = """    // Mirror persisted CSV source bytes into Pyodide before every Python run.\n    // This makes workspace CSVs available from normal scratch/code files after\n    // upload or reload without requiring the user to reopen a CSV preview first.\n    if (language === 'python' && runtime instanceof PythonRuntime) {\n      try {\n        const { synced, duplicateNames } = await runtime.syncCSVFiles(\n          files\n            .filter((file) => file.language === 'csv')\n            .map((file) => ({ name: file.name, content: file.content })),\n        );\n        if (synced.length > 0) {\n          addToConsole(`✓ Python workspace CSVs refreshed: ${synced.join(', ')}`);\n        }\n        if (duplicateNames.length > 0) {\n          addToConsole(\n            `⚠ Duplicate CSV names in Python workspace: ${duplicateNames.join(', ')}. The most recent workspace copy is used.`,\n          );\n        }\n      } catch (error: any) {\n        addToConsole(`✗ Failed to prepare Python workspace files: ${error.message}`, true);\n        setIsRunning(false);\n        return;\n      }\n    }\n    \n"""
ide = ide[:start] + python_sync_block + ide[end:]

# Remove the upload-time side effect. The run-time sync above is now the single
# authoritative path and can also clean up deleted CSVs from the Pyodide VFS.
eager_start = "      // Write CSV to Python runtime virtual filesystem\n"
eager_end = "    } catch (e) {\n"
require_once(ide, eager_start, "eager Python CSV write block")
eager_pos = ide.index(eager_start)
eager_end_pos = ide.index(eager_end, eager_pos)
ide = ide[:eager_pos] + ide[eager_end_pos:]

# Notebook Python cells get the same workspace semantics as normal runs.
notebook_marker = "    if (scratchLanguage === 'r' && runtime instanceof RRuntime) {\n"
require_once(ide, notebook_marker, "notebook R sync marker")
notebook_python = """    if (scratchLanguage === 'python' && runtime instanceof PythonRuntime) {\n      await runtime.syncCSVFiles(\n        files\n          .filter((file) => file.language === 'csv')\n          .map((file) => ({ name: file.name, content: file.content })),\n      );\n    }\n"""
ide = ide.replace(notebook_marker, notebook_python + notebook_marker, 1)

# A CSV is a workspace resource, not a modal trap. Give the source CSV context a
# direct way back to the ordinary scratch IDE regardless of data/code sub-view.
toggle_marker = """        <div className=\"flex items-center gap-2 p-2 bg-toolbar border-b border-border\">\n          <Button\n            variant={csvViewMode === 'data' ? 'default' : 'ghost'}\n"""
require_once(ide, toggle_marker, "CSV toggle bar")
back_button = """        <div className=\"flex items-center gap-2 p-2 bg-toolbar border-b border-border\">\n          <Button\n            variant=\"ghost\"\n            size=\"sm\"\n            onClick={() => {\n              setActiveFile(null);\n              setShowDataset(null);\n            }}\n          >\n            Back to IDE\n          </Button>\n          <Button\n            variant={csvViewMode === 'data' ? 'default' : 'ghost'}\n"""
ide = ide.replace(toggle_marker, back_button, 1)

source_viewer_marker = """                  onExportCSV={() => handleExportSourceCSV(currentFile)}\n                  onVisualize={() => setPlotBuilderOpen(true)}\n"""
require_once(ide, source_viewer_marker, "source CSV DatasetViewer actions")
source_viewer_replacement = """                  onExportCSV={() => handleExportSourceCSV(currentFile)}\n                  onVisualize={() => setPlotBuilderOpen(true)}\n                  onClose={() => {\n                    setActiveFile(null);\n                    setShowDataset(null);\n                  }}\n"""
ide = ide.replace(source_viewer_marker, source_viewer_replacement, 1)
write(ide_path, ide)


runtime_path = "src/runtimes/PythonRuntime.ts"
runtime = read(runtime_path)
import_marker = "import { checkLibraryCompatibility } from '@/utils/libraryCompatibility';\n\n"
require_once(runtime, import_marker, "PythonRuntime import marker")
interfaces = """import { checkLibraryCompatibility } from '@/utils/libraryCompatibility';\n\ninterface WorkspaceCSVFile {\n  name: string;\n  content: string;\n}\n\ninterface PythonCSVSyncResult {\n  synced: string[];\n  duplicateNames: string[];\n}\n\n"""
runtime = runtime.replace(import_marker, interfaces, 1)

method_marker = "  async writeCSVToFS(filename: string, content: string): Promise<void> {\n"
require_once(runtime, method_marker, "writeCSVToFS method")
sync_method = """  private validateWorkspaceFileName(name: string): void {\n    if (!name || name.includes('/') || name.includes('\\\\') || name.includes('\\0')) {\n      throw new Error(`Python cannot mirror workspace CSV with unsafe file name: ${name || '(blank)'}`);\n    }\n  }\n\n  async syncCSVFiles(files: WorkspaceCSVFile[]): Promise<PythonCSVSyncResult> {\n    if (!this.isInitialized || !this.worker) {\n      throw new Error('Python runtime not initialized');\n    }\n\n    const latestByName = new Map<string, string>();\n    const duplicateNames = new Set<string>();\n    for (const file of files) {\n      this.validateWorkspaceFileName(file.name);\n      if (latestByName.has(file.name)) duplicateNames.add(file.name);\n      latestByName.set(file.name, file.content);\n    }\n\n    const synced = [...latestByName.keys()];\n    return new Promise((resolve, reject) => {\n      const listener = (evt: MessageEvent) => {\n        const msg = evt.data;\n        if (msg.type === 'csv-sync-complete') {\n          this.worker?.removeEventListener('message', listener);\n          resolve({ synced, duplicateNames: [...duplicateNames] });\n        } else if (msg.type === 'error') {\n          this.worker?.removeEventListener('message', listener);\n          reject(new Error(msg.error));\n        }\n      };\n\n      this.worker!.addEventListener('message', listener);\n      this.worker!.postMessage({\n        type: 'syncCSVs',\n        files: [...latestByName].map(([name, content]) => ({ name, content })),\n      });\n    });\n  }\n\n"""
runtime = runtime.replace(method_marker, sync_method + method_marker, 1)
write(runtime_path, runtime)


worker_path = "public/pyWorker.js"
worker = read(worker_path)
worker_state_marker = "let pyodide = null;\nlet isInitializing = false;\n"
require_once(worker, worker_state_marker, "PyWorker state marker")
worker = worker.replace(
    worker_state_marker,
    worker_state_marker + "let managedCsvFiles = new Set();\n",
    1,
)

write_marker = "  // =============== WRITE CSV TO VIRTUAL FS ===============\n"
require_once(worker, write_marker, "PyWorker write CSV marker")
sync_handler = """  // =============== SYNC WORKSPACE CSV FILES ===============\n  if (msg.type === \"syncCSVs\") {\n    try {\n      await initPyodideSafe();\n      if (!pyodide) throw new Error(\"Pyodide not initialized\");\n\n      const files = Array.isArray(msg.files) ? msg.files : [];\n      const nextNames = new Set(files.map(file => file.name));\n\n      for (const oldName of managedCsvFiles) {\n        if (nextNames.has(oldName)) continue;\n        try {\n          pyodide.FS.unlink(oldName);\n        } catch {\n          // The VFS may already have been reset or the file removed manually.\n        }\n      }\n\n      for (const file of files) {\n        pyodide.FS.writeFile(file.name, file.content);\n      }\n\n      managedCsvFiles = nextNames;\n      self.postMessage({\n        type: \"csv-sync-complete\",\n        files: [...nextNames],\n      });\n    } catch (err) {\n      self.postMessage({ type: \"error\", error: String(err) });\n    }\n    return;\n  }\n\n"""
worker = worker.replace(write_marker, sync_handler + write_marker, 1)
write(worker_path, worker)


package_path = "package.json"
package = json.loads(read(package_path))
package["scripts"]["test:csv-workspace"] = "node scripts/check-csv-workspace-access.mjs"
for key in ("build", "build:dev"):
    command = package["scripts"][key]
    if "npm run test:csv-workspace" not in command:
        command = command.replace(" && vite build", " && npm run test:csv-workspace && vite build")
        command = command.replace(" && vite build --mode development", " && npm run test:csv-workspace && vite build --mode development")
    package["scripts"][key] = command
write(package_path, json.dumps(package, indent=2) + "\n")


guard = r'''import fs from 'node:fs';

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
'''
write('scripts/check-csv-workspace-access.mjs', guard)
