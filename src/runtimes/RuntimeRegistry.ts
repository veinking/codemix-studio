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
    return Array.from(this.runtimes.values()).map(r => r.config);
  }

  static getAvailableOnDevice(isMobile: boolean): RuntimeConfig[] {
    return this.getAllLanguages().filter(cfg => 
      cfg.availableOn === 'all' || 
      (isMobile ? cfg.availableOn === 'mobile' : cfg.availableOn === 'desktop')
    );
  }

  static detectLanguage(filename: string): string | undefined {
    for (const runtime of this.runtimes.values()) {
      const ext = runtime.config.fileExtensions.find(e => filename.endsWith(e));
      if (ext) return runtime.config.name;
    }
    return undefined;
  }

  static getLanguageFromExtension(filename: string): SupportedLanguage {
    const detected = this.detectLanguage(filename);
    return (detected as SupportedLanguage) || 'python';
  }

  static isExecutableRuntime(language: string): boolean {
    const runtime = this.get(language);
    return runtime?.config.supportsPackages !== undefined;
  }
}
