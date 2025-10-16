export interface RuntimeConfig {
  name: string;
  displayName: string;
  fileExtensions: string[];
  color: string;
  supportsPackages: boolean;
  availableOn: 'all' | 'desktop' | 'mobile';
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
