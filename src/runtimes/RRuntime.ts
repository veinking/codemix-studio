import { RuntimeExecutor, RuntimeConfig, ExecutionResult, CompatibilityResult } from './RuntimeInterface';
import { checkLibraryCompatibility } from '@/utils/libraryCompatibility';
import { normalizeRSourceForExecution } from './rSourceNormalization';

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
    if (!name || name.includes('/') || name.includes('\\') || name.includes('\0')) {
      throw new Error(`R cannot mirror workspace CSV with unsafe file name: ${name || '(blank)'}`);
    }
  }

  private workspacePath(name: string): string {
    if (!this.workingDirectory) {
      throw new Error('R working directory is unavailable');
    }
    return `${this.workingDirectory.replace(/\/+$/, '')}/${name}`;
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
      const normalizedSource = normalizeRSourceForExecution(code);
      const executableCode = normalizedSource.code;
      if (normalizedSource.normalizedCount > 0) {
        const noun = normalizedSource.normalizedCount === 1 ? 'character' : 'characters';
        onOutput(`ℹ R normalized ${normalizedSource.normalizedCount} invisible clipboard ${noun} outside strings/comments.`);
      }

      // captureR is webR's supported console/graphics path. withAutoprint makes
      // bare expressions behave like an R console instead of silently vanishing.
      // R errors are allowed to throw through to IDE error handling so bIDE never
      // reports a failed R run as "Execution completed".
      const capture = await shelter.captureR(executableCode, {
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
      const output = outputLines.join('\n');
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
