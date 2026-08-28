from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    if old not in text:
        raise RuntimeError(f"Expected text not found in {path}: {old[:120]!r}")
    path.write_text(text.replace(old, new, 1))


r_runtime = ROOT / "src/runtimes/RRuntime.ts"
r_runtime.write_text("""import { RuntimeExecutor, RuntimeConfig, ExecutionResult, CompatibilityResult } from './RuntimeInterface';
import { checkLibraryCompatibility } from '@/utils/libraryCompatibility';

const WEBR_VERSION = '0.3.3';
const WEBR_BASE_URL = `https://webr.r-wasm.org/v${WEBR_VERSION}/`;
const WEBR_MODULE_URL = `${WEBR_BASE_URL}webr.mjs`;

interface WorkspaceCSVFile {
  name: string;
  content: string;
}

interface RFileSyncResult {
  synced: string[];
  duplicateNames: string[];
}

export class RRuntime implements RuntimeExecutor {
  private webR: any | null = null;
  private workingDirectory: string | null = null;
  private managedCsvFiles = new Set<string>();
  public isInitialized = false;

  public config: RuntimeConfig = {
    name: 'r',
    displayName: 'R',
    fileExtensions: ['.r', '.R'],
    color: 'hsl(var(--chart-2))',
    supportsPackages: true,
    availableOn: 'all',
  };

  async initialize(isMobile: boolean): Promise<void> {
    if (this.isInitialized) return;

    try {
      // webR is intentionally pinned so upstream changes cannot silently alter
      // bIDE's runtime behavior. First load still requires network access.
      // @ts-ignore - remote ESM import is resolved by the browser at runtime.
      const { WebR } = await import(/* @vite-ignore */ WEBR_MODULE_URL);

      const config: any = isMobile
        ? {
            baseUrl: WEBR_BASE_URL,
            channelType: 'PostMessage' as const,
          }
        : { baseUrl: WEBR_BASE_URL };

      this.webR = new WebR(config);
      await this.webR.init();
      this.workingDirectory = await this.webR.evalRString('getwd()');
      this.isInitialized = true;
    } catch (error: any) {
      this.webR = null;
      this.workingDirectory = null;
      this.isInitialized = false;
      const detail = error?.message ? ` ${error.message}` : '';
      throw new Error(`R runtime could not load from webR ${WEBR_VERSION}. Check your connection and retry.${detail}`);
    }
  }

  private requireRuntime(): any {
    if (!this.isInitialized || !this.webR) {
      throw new Error('R runtime not initialized');
    }
    return this.webR;
  }

  private validateWorkspaceFileName(name: string): void {
    if (!name || name.includes('/') || name.includes('\\\\') || name.includes('\\0')) {
      throw new Error(`R cannot mirror workspace CSV with unsafe file name: ${name || '(blank)'}`);
    }
  }

  private workspacePath(name: string): string {
    if (!this.workingDirectory) {
      throw new Error('R working directory is unavailable');
    }
    return `${this.workingDirectory.replace(/\\/+$/, '')}/${name}`;
  }

  async syncCSVFiles(files: WorkspaceCSVFile[]): Promise<RFileSyncResult> {
    const webR = this.requireRuntime();
    const latestByName = new Map<string, string>();
    const duplicateNames = new Set<string>();

    for (const file of files) {
      this.validateWorkspaceFileName(file.name);
      if (latestByName.has(file.name)) duplicateNames.add(file.name);
      latestByName.set(file.name, file.content);
    }

    const nextNames = new Set(latestByName.keys());
    for (const oldName of this.managedCsvFiles) {
      if (nextNames.has(oldName)) continue;
      try {
        await webR.FS.unlink(this.workspacePath(oldName));
      } catch {
        // The VFS may already have been cleared; stale managed files are best-effort cleanup.
      }
    }

    const encoder = new TextEncoder();
    for (const [name, content] of latestByName) {
      await webR.FS.writeFile(this.workspacePath(name), encoder.encode(content));
    }

    this.managedCsvFiles = nextNames;
    return {
      synced: [...latestByName.keys()],
      duplicateNames: [...duplicateNames],
    };
  }

  private bitmapToPngDataUrl(image: ImageBitmap): string {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('R plot canvas could not be created');
    context.drawImage(image, 0, 0, image.width, image.height);
    return canvas.toDataURL('image/png');
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    const webR = this.requireRuntime();
    const shelter = await new webR.Shelter();
    let images: ImageBitmap[] = [];

    try {
      // captureR is webR's supported console/graphics path. withAutoprint makes
      // bare expressions behave like an R console instead of silently vanishing.
      // R errors are allowed to throw through to IDE error handling so bIDE never
      // reports a failed R run as "Execution completed".
      const capture = await shelter.captureR(code, {
        captureStreams: true,
        captureConditions: false,
        captureGraphics: {
          width: 800,
          height: 600,
          bg: 'white',
        },
        withAutoprint: true,
        throwJsException: true,
      });

      images = Array.isArray(capture.images) ? capture.images : [];
      const outputLines = (capture.output || [])
        .filter((message: any) => message?.type === 'stdout' || message?.type === 'stderr')
        .map((message: any) => String(message.data ?? ''))
        .filter((line: string) => line.length > 0);
      const output = outputLines.join('\\n');
      const result: ExecutionResult = { output, datasets: [] };

      if (output.trim().length > 0) onOutput(output);
      if (images.length > 0) {
        result.plotUrl = this.bitmapToPngDataUrl(images[images.length - 1]);
      }

      return result;
    } finally {
      images.forEach((image) => {
        try {
          image.close?.();
        } catch {
          // Ignore browser-specific ImageBitmap cleanup failures.
        }
      });
      try {
        await shelter.purge();
      } catch {
        // Do not mask the user's R result/error with cleanup failures.
      }
    }
  }

  async installPackage(name: string): Promise<void> {
    const webR = this.requireRuntime();
    const packageName = name.trim();
    if (!/^[A-Za-z][A-Za-z0-9.]*$/.test(packageName)) {
      throw new Error('Enter a valid R package name (letters, numbers, and periods only)');
    }

    // Use webR's Wasm package repository instead of source CRAN installation.
    await webR.installPackages([packageName]);
  }

  checkCompatibility(code: string, isMobile: boolean): CompatibilityResult {
    const result = checkLibraryCompatibility(code, 'r', isMobile);
    return {
      compatible: result.isCompatible,
      warnings: result.warnings,
      suggestions: result.suggestions,
    };
  }
}
""")

ide = ROOT / "src/pages/IDE.tsx"
replace_once(
    ide,
    "  const [installedPackages, setInstalledPackages] = useState<string[]>([]);",
    """  const [installedPackagesByLanguage, setInstalledPackagesByLanguage] = useState<Record<'python' | 'r', string[]>>({
    python: [],
    r: [],
  });""",
)
replace_once(
    ide,
    """    const language = activeFile
      ? (files.find(f => f.id === activeFile)?.language || 'python')
      : scratchLanguage;
""",
    """    const activeLanguage = activeFile
      ? files.find(f => f.id === activeFile)?.language
      : null;
    const language = activeLanguage === 'python' || activeLanguage === 'r' ||
      activeLanguage === 'javascript' || activeLanguage === 'sql'
      ? activeLanguage
      : scratchLanguage;
""",
)
replace_once(
    ide,
    "      setInstalledPackages(prev => [...prev, packageName]);",
    """      if (language === 'python' || language === 'r') {
        setInstalledPackagesByLanguage(prev => ({
          ...prev,
          [language]: prev[language].includes(packageName)
            ? prev[language]
            : [...prev[language], packageName],
        }));
      }""",
)

sql_sync_block = """    if (language === 'sql' && runtime instanceof SQLRuntime) {
      try {
        const mappings = runtime.syncDatasets(collectSQLDatasets());
        if (mappings.length > 0) {
          addToConsole(
            `✓ SQL tables refreshed: ${mappings
              .map(({ datasetName, tableName }) => `${datasetName} → ${tableName}`)
              .join(', ')}`,
          );
        }
      } catch (error: any) {
        addToConsole(`✗ Failed to prepare SQL workspace tables: ${error.message}`, true);
        setIsRunning(false);
        return;
      }
    }
"""
r_sync_block = sql_sync_block + """
    // Mirror persisted CSV source bytes into webR before every R run so
    // read.csv(\"file.csv\") works immediately after upload or reload.
    if (language === 'r' && runtime instanceof RRuntime) {
      try {
        const { synced, duplicateNames } = await runtime.syncCSVFiles(
          files
            .filter((file) => file.language === 'csv')
            .map((file) => ({ name: file.name, content: file.content })),
        );
        if (synced.length > 0) {
          addToConsole(`✓ R workspace CSVs refreshed: ${synced.join(', ')}`);
        }
        if (duplicateNames.length > 0) {
          addToConsole(
            `⚠ Duplicate CSV names in R workspace: ${duplicateNames.join(', ')}. The most recent workspace copy is used.`,
          );
        }
      } catch (error: any) {
        addToConsole(`✗ Failed to prepare R workspace files: ${error.message}`, true);
        setIsRunning(false);
        return;
      }
    }
"""
replace_once(ide, sql_sync_block, r_sync_block)

replace_once(
    ide,
    """    if (scratchLanguage === 'sql' && runtime instanceof SQLRuntime) {
      runtime.syncDatasets(collectSQLDatasets());
    }

    let capturedOutput = '';
""",
    """    if (scratchLanguage === 'sql' && runtime instanceof SQLRuntime) {
      runtime.syncDatasets(collectSQLDatasets());
    }
    if (scratchLanguage === 'r' && runtime instanceof RRuntime) {
      await runtime.syncCSVFiles(
        files
          .filter((file) => file.language === 'csv')
          .map((file) => ({ name: file.name, content: file.content })),
      );
    }

    let capturedOutput = '';
""",
)

replace_once(
    ide,
    """  const currentFile = files.find((f) => f.id === activeFile);
  const currentFileDataset = currentFile?.language === 'csv'
""",
    """  const currentFile = files.find((f) => f.id === activeFile);
  const currentRuntimeLanguage: 'python' | 'r' | 'javascript' | 'sql' =
    currentFile?.language === 'python' || currentFile?.language === 'r' ||
    currentFile?.language === 'javascript' || currentFile?.language === 'sql'
      ? currentFile.language
      : scratchLanguage;
  const installedPackages = currentRuntimeLanguage === 'python' || currentRuntimeLanguage === 'r'
    ? installedPackagesByLanguage[currentRuntimeLanguage]
    : [];
  const currentFileDataset = currentFile?.language === 'csv'
""",
)

ui_language_block = """      currentLanguage={
        currentFile?.language === 'python' || currentFile?.language === 'r' || 
        currentFile?.language === 'javascript' || currentFile?.language === 'sql'
          ? currentFile.language
          : scratchLanguage
      }
"""
replace_once(ide, ui_language_block, "      currentLanguage={currentRuntimeLanguage}\n")
replace_once(ide, ui_language_block, "      currentLanguage={currentRuntimeLanguage}\n")
replace_once(
    ide,
    """      installedPackages={installedPackages}
      onInstallPackage={installPackage}
      isInstalling={isInstalling}
      onOpenLabTrainer={() => setLabTrainerOpen(true)}
""",
    """      installedPackages={installedPackages}
      onInstallPackage={installPackage}
      isInstalling={isInstalling}
      currentLanguage={currentRuntimeLanguage}
      onOpenLabTrainer={() => setLabTrainerOpen(true)}
""",
)

file_explorer = ROOT / "src/components/FileExplorer.tsx"
text = file_explorer.read_text()
text, count = re.subn(
    r"\n  rmarkdown: \{ extension: '\\.rmd'.*?\n  text:",
    "\n  text:",
    text,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError("Could not remove unsupported R Markdown template")
text = text.replace('                    <SelectItem value="rmarkdown">R Markdown (.rmd)</SelectItem>\n', '', 1)
text = text.replace('accept=".py,.r,.rmd,.csv,.txt"', 'accept=".py,.r,.csv,.txt"', 1)
text = text.replace(
    "  isInstalling: boolean;\n  onOpenLabTrainer?: () => void;",
    "  isInstalling: boolean;\n  currentLanguage: 'python' | 'r' | 'javascript' | 'sql';\n  onOpenLabTrainer?: () => void;",
    1,
)
text = text.replace(
    "  isInstalling,\n  onOpenLabTrainer = () => {},",
    "  isInstalling,\n  currentLanguage,\n  onOpenLabTrainer = () => {},",
    1,
)
text = text.replace(
    """      <PackageManager
        installedPackages={installedPackages}
        onInstallPackage={onInstallPackage}
        isInstalling={isInstalling}
      />""",
    """      <PackageManager
        installedPackages={installedPackages}
        onInstallPackage={onInstallPackage}
        isInstalling={isInstalling}
        currentLanguage={currentLanguage}
      />""",
    1,
)
file_explorer.write_text(text)

package_manager = ROOT / "src/components/PackageManager.tsx"
replace_once(
    package_manager,
    "                      onClick={() => !isInstalled && onInstallPackage(pkg)}",
    "                      onClick={() => !isInstalled && !isInstalling && onInstallPackage(pkg)}",
)

r_docs = ROOT / "src/pages/docs/RDocs.tsx"
replace_once(
    r_docs,
    'description="Free online R IDE for statistics and data science. Run R code with webR in your browser. Includes ggplot2, dplyr, and statistical analysis tools."',
    'description="Browser-based R IDE for statistics and data science powered by webR. Supports base R and compatible WebAssembly packages such as ggplot2 and dplyr when installed."',
)
replace_once(
    r_docs,
    '<span>Install CRAN packages</span>',
    '<span>Install compatible R packages from the webR WebAssembly repository</span>',
)
replace_once(
    r_docs,
    "                <li>🔹 View data: head(df), summary(df), str(df)</li>",
    """                <li>🔹 View data: head(df), summary(df), str(df)</li>
                <li>🔹 Uploaded CSVs are mirrored into webR before each run: df &lt;- read.csv(\"sample.csv\")</li>
                <li>🔹 Install packages from bIDE's Packages panel; availability depends on webR's WebAssembly package repository</li>
                <li>🔹 Package installs live in the current R session and must be installed again after a full reload</li>""",
)
replace_once(
    r_docs,
    "                <li>⚠️ Vectors are recycled in operations</li>",
    """                <li>⚠️ Vectors are recycled in operations</li>
                <li>⚠️ webR first load and package installation require a network connection</li>
                <li>⚠️ Native/server-only R packages may not be available in the browser runtime</li>""",
)

r_templates = ROOT / "src/components/RTemplateLibrary.tsx"
replace_once(
    r_templates,
    "            Beautiful ggplot2 visualizations and tidyverse workflows",
    "            Templates assume a data frame named df. Load a workspace CSV with df <- read.csv(\"file.csv\") and install the listed webR packages first.",
)

package_path = ROOT / "package.json"
package_data = json.loads(package_path.read_text())
scripts = package_data["scripts"]
scripts["test:r-runtime"] = "node scripts/check-r-runtime-workflow.mjs"
scripts["build"] = scripts["build"].replace(
    "npm run test:sql-analyst && vite build",
    "npm run test:sql-analyst && npm run test:r-runtime && vite build",
)
scripts["build:dev"] = scripts["build:dev"].replace(
    "npm run test:sql-analyst && vite build --mode development",
    "npm run test:sql-analyst && npm run test:r-runtime && vite build --mode development",
)
package_path.write_text(json.dumps(package_data, indent=2) + "\n")

guard = ROOT / "scripts/check-r-runtime-workflow.mjs"
guard.write_text("""import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(`[R runtime guard] ${message}`);
};

const runtime = read('src/runtimes/RRuntime.ts');
const ide = read('src/pages/IDE.tsx');
const explorer = read('src/components/FileExplorer.tsx');
const docs = read('src/pages/docs/RDocs.tsx');
const templates = read('src/components/RTemplateLibrary.tsx');

assert(runtime.includes('captureR(code'), 'R execution must use webR captureR');
assert(runtime.includes('withAutoprint: true'), 'R console must autoprint bare expressions');
assert(runtime.includes('throwJsException: true'), 'R errors must propagate to IDE error handling');
assert(!runtime.includes('capture.output'), 'legacy capture.output wrapper must not return');
assert(!runtime.includes('base64enc'), 'plot capture must not depend on base64enc');
assert(runtime.includes('syncCSVFiles'), 'R runtime must mirror workspace CSV files');
assert(runtime.includes('FS.writeFile'), 'R CSV mirroring must use the webR VFS');
assert(runtime.includes('installPackages([packageName])'), 'R packages must use webR binary installer');
assert(!runtime.includes("install.packages('${name}')"), 'unsafe source package interpolation must not return');
assert((ide.match(/runtime\.syncCSVFiles\(/g) || []).length >= 2, 'normal and notebook R runs must refresh CSV files');
assert(ide.includes('installedPackagesByLanguage'), 'Python and R package badges must not share one list');
assert(explorer.includes('currentLanguage={currentLanguage}'), 'Explorer package manager must follow the active language');
assert(!explorer.includes('rmarkdown'), 'unsupported R Markdown creation must stay removed');
assert(!explorer.includes('.rmd'), 'unsupported R Markdown upload must stay removed');
assert(docs.includes('webR WebAssembly repository'), 'R docs must describe browser package availability honestly');
assert(docs.includes('must be installed again after a full reload'), 'R docs must explain package session lifetime');
assert(docs.includes('Uploaded CSVs are mirrored into webR'), 'R docs must explain CSV-to-R workflow');
assert(templates.includes('Templates assume a data frame named df'), 'R templates must disclose their df/package prerequisites');

console.log('✓ R runtime workflow guard passed');
""")

# Remove this one-time patch machinery from the verified branch.
(ROOT / ".github/workflows/apply-r-runtime-audit.yml").unlink()
Path(__file__).unlink()
