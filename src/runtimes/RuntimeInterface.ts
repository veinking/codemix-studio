export interface RuntimeConfig {
  name: string;
  displayName: string;
  fileExtensions: string[];
  color: string;
  supportsPackages: boolean;
  availableOn: 'all' | 'desktop' | 'mobile';
  /**
   * Whether bIDE can execute this language inside the product or only edit it.
   * Optional for backward compatibility; existing concrete runtimes are treated
   * as browser runtimes unless they explicitly mark themselves editor-only.
   */
  executionMode?: 'browser' | 'editor-only';
}

export interface Dataset {
  name: string;
  headers: string[];
  data: any[][];
}

export interface ExecutionResult {
  output: string;
  error?: string;
  plotUrl?: string;
  datasets?: Dataset[];
}

export interface CompatibilityResult {
  compatible: boolean;
  warnings: string[];
  suggestions: string[];
}

export interface RuntimeExecutor {
  initialize(isMobile: boolean): Promise<void>;
  execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult>;
  installPackage?(name: string): Promise<void>;
  checkCompatibility?(code: string, isMobile: boolean): CompatibilityResult;
  isInitialized: boolean;
  config: RuntimeConfig;
}
