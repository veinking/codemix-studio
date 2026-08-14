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

export class RuntimeRegistry {
  private static runtimes = new Map<string, RuntimeExecutor>();

  static register(runtime: RuntimeExecutor): void {
    this.runtimes.set(runtime.config.name, runtime);
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
