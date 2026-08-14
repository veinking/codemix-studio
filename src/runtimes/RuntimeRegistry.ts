import { RuntimeExecutor, RuntimeConfig } from './RuntimeInterface';

export type SupportedLanguage =
  | 'python'
  | 'r'
  | 'javascript'
  | 'sql'
  | 'php'
  | 'ruby'
  | 'lua'
  | 'java'
  | 'cpp'
  | 'c'
  | 'rust'
  | 'go'
  | 'swift'
  | 'kotlin'
  | 'typescript'
  | 'csharp';

const NORMALIZED_EXECUTE = Symbol('bide.normalizedExecute');

type NormalizedRuntime = RuntimeExecutor & {
  [NORMALIZED_EXECUTE]?: boolean;
};

function normalizeRuntimeExecution(runtime: RuntimeExecutor): RuntimeExecutor {
  const managed = runtime as NormalizedRuntime;
  if (managed[NORMALIZED_EXECUTE]) return runtime;

  const execute = runtime.execute.bind(runtime);

  // The current IDE success path assumes execute() rejects when execution fails.
  // Several browser runtimes historically returned { error } instead, which made
  // the UI print an error and then immediately print "Execution completed ✓".
  // Normalize that contract in one place without hiding runtime-specific methods
  // such as PythonRuntime.writeCSVToFS().
  runtime.execute = async (code, onOutput) => {
    const result = await execute(code, onOutput);
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  };

  managed[NORMALIZED_EXECUTE] = true;
  return runtime;
}

export class RuntimeRegistry {
  private static runtimes = new Map<string, RuntimeExecutor>();

  static register(runtime: RuntimeExecutor): void {
    this.runtimes.set(runtime.config.name, normalizeRuntimeExecution(runtime));
  }

  static get(language: string): RuntimeExecutor | undefined {
    return this.runtimes.get(language);
  }

  static getAllLanguages(): RuntimeConfig[] {
    return Array.from(this.runtimes.values()).map((runtime) => runtime.config);
  }

  static getAvailableOnDevice(isMobile: boolean): RuntimeConfig[] {
    return this.getAllLanguages().filter((config) =>
      config.availableOn === 'all' ||
      (isMobile ? config.availableOn === 'mobile' : config.availableOn === 'desktop')
    );
  }

  static detectLanguage(filename: string): string | undefined {
    const normalized = filename.toLowerCase();
    for (const runtime of this.runtimes.values()) {
      const extension = runtime.config.fileExtensions.find((value) => normalized.endsWith(value.toLowerCase()));
      if (extension) return runtime.config.name;
    }
    return undefined;
  }

  static getLanguageFromExtension(filename: string): SupportedLanguage {
    const detected = this.detectLanguage(filename);
    return (detected as SupportedLanguage) || 'python';
  }

  static isExecutableRuntime(language: string): boolean {
    const runtime = this.get(language);
    if (!runtime) return false;
    return runtime.config.executionMode !== 'editor-only';
  }
}
