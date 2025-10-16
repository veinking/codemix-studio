import { RuntimeExecutor, RuntimeConfig, ExecutionResult } from './RuntimeInterface';

export class JavaScriptRuntime implements RuntimeExecutor {
  public isInitialized = true;
  private consoleHistory: string[] = [];

  public config: RuntimeConfig = {
    name: 'javascript',
    displayName: 'JavaScript',
    fileExtensions: ['.js', '.mjs'],
    color: 'hsl(var(--chart-3))',
    supportsPackages: false,
    availableOn: 'all',
  };

  async initialize(_isMobile: boolean): Promise<void> {
    this.isInitialized = true;
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    const result: ExecutionResult = { output: '' };
    this.consoleHistory = [];

    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    const captureOutput = (type: string, ...args: any[]) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      
      const output = type === 'log' ? message : `[${type.toUpperCase()}] ${message}`;
      this.consoleHistory.push(output);
      onOutput(output);
      originalConsole[type as keyof typeof originalConsole](...args);
    };

    console.log = (...args) => captureOutput('log', ...args);
    console.error = (...args) => captureOutput('error', ...args);
    console.warn = (...args) => captureOutput('warn', ...args);
    console.info = (...args) => captureOutput('info', ...args);

    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction(code);
      const executionResult = await fn();
      
      if (executionResult !== undefined) {
        const returnValue = typeof executionResult === 'object' 
          ? JSON.stringify(executionResult, null, 2)
          : String(executionResult);
        this.consoleHistory.push(returnValue);
        onOutput(returnValue);
      }
      
      result.output = this.consoleHistory.join('\n');
    } catch (error: any) {
      result.error = error.message || String(error);
      result.output = this.consoleHistory.join('\n') + `\nError: ${result.error}`;
      onOutput(`Error: ${result.error}`);
    } finally {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
    }

    return result;
  }
}
