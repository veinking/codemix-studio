import { RuntimeExecutor, RuntimeConfig, ExecutionResult } from './RuntimeInterface';

/**
 * Generic runtime for languages that only have editor support (syntax highlighting)
 * but cannot execute in the browser without compilation.
 * Used for: Java, C, C++, Rust, Go, Swift, Kotlin, TypeScript (needs compilation), etc.
 */
export class EditorOnlyRuntime implements RuntimeExecutor {
  config: RuntimeConfig;
  isInitialized = true; // Always initialized since it's editor-only

  constructor(config: RuntimeConfig) {
    this.config = {
      ...config,
      supportsPackages: false,
      availableOn: 'all'
    };
  }

  async initialize(_isMobile: boolean): Promise<void> {
    // No initialization needed for editor-only
    this.isInitialized = true;
  }

  async execute(_code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    const message = `⚠️ ${this.config.displayName} execution is not supported in the browser.\n\n` +
      `This language requires compilation before execution. ` +
      `You can use the editor to write and download your ${this.config.displayName} code, ` +
      `but it must be compiled externally to run.\n\n` +
      `Features available:\n` +
      `✓ Syntax highlighting\n` +
      `✓ Code editing\n` +
      `✓ AI assistance\n` +
      `✓ Code translation\n` +
      `✓ File export\n\n` +
      `To execute this code, download it and use:\n` +
      this.getExecutionInstructions();

    onOutput(message);
    
    return {
      output: message,
      error: undefined
    };
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
        return '• csc yourfile.cs && mono yourfile.exe';
      default:
        return `• Use a ${this.config.displayName} compiler/interpreter on your system`;
    }
  }
}
