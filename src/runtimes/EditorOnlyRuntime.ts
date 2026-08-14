import { RuntimeExecutor, RuntimeConfig, ExecutionResult } from './RuntimeInterface';

/**
 * Generic runtime for languages that only have editor support (syntax highlighting)
 * but cannot execute in the browser without compilation.
 * Used for: Java, C, C++, Rust, Go, Swift, Kotlin, TypeScript, C#, etc.
 */
export class EditorOnlyRuntime implements RuntimeExecutor {
  config: RuntimeConfig;
  isInitialized = true;

  constructor(config: RuntimeConfig) {
    this.config = {
      ...config,
      supportsPackages: false,
      availableOn: 'all',
      executionMode: 'editor-only',
    };
  }

  async initialize(_isMobile: boolean): Promise<void> {
    this.isInitialized = true;
  }

  async execute(_code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    const message = `⚠️ ${this.config.displayName} execution is not supported in the browser.\n\n` +
      `You can still write, edit, translate, and export ${this.config.displayName} code in bIDE. ` +
      `Running it currently requires an external compiler/interpreter.\n\n` +
      `To execute this code externally:\n${this.getExecutionInstructions()}`;

    onOutput(message);
    return { output: message };
  }

  private getExecutionInstructions(): string {
    switch (this.config.name) {
      case 'java':
        return '• javac YourFile.java && java YourClass';
      case 'cpp':
        return '• g++ yourfile.cpp -o output && ./output';
      case 'c':
        return '• gcc yourfile.c -o output && ./output';
      case 'rust':
        return '• rustc yourfile.rs && ./yourfile';
      case 'go':
        return '• go run yourfile.go';
      case 'swift':
        return '• swift yourfile.swift';
      case 'kotlin':
        return '• kotlinc yourfile.kt -include-runtime -d output.jar && java -jar output.jar';
      case 'typescript':
        return '• tsc yourfile.ts && node yourfile.js';
      case 'csharp':
        return '• dotnet run (recommended) or compile with your installed C# toolchain';
      default:
        return `• Use a ${this.config.displayName} compiler/interpreter on your system`;
    }
  }
}
