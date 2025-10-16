import { RuntimeExecutor, RuntimeConfig, ExecutionResult, CompatibilityResult } from './RuntimeInterface';
import { checkLibraryCompatibility } from '@/utils/libraryCompatibility';

export class PythonRuntime implements RuntimeExecutor {
  private worker: Worker | null = null;
  private isReady = false;
  public isInitialized = false;

  public config: RuntimeConfig = {
    name: 'python',
    displayName: 'Python',
    fileExtensions: ['.py'],
    color: 'hsl(var(--chart-1))',
    supportsPackages: true,
    availableOn: 'all',
  };

  async initialize(isMobile: boolean): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[PythonRuntime] Initializing Pyodide worker...');
      
      // Pin the same version everywhere
      const PYODIDE_VERSION = '0.28.3';
      const indexURL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

      // Load worker from public directory (not bundled by Vite)
      // This avoids code-splitting issues with IIFE format
      this.worker = new Worker('/pyWorker.js');

      // Wait for ready signal
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Pyodide initialization timeout (40s)'));
        }, 40000);

        const handler = (evt: MessageEvent) => {
          const msg = evt.data;
          
          if (msg.type === 'ready') {
            clearTimeout(timeout);
            this.worker?.removeEventListener('message', handler);
            this.isReady = true;
            resolve();
          } else if (msg.type === 'error') {
            clearTimeout(timeout);
            this.worker?.removeEventListener('message', handler);
            reject(new Error(msg.error));
          }
        };

        this.worker?.addEventListener('message', handler);
        this.worker?.postMessage({ type: 'init', indexURL, mobile: isMobile });
      });

      this.isInitialized = true;
      console.log('[PythonRuntime] Python runtime initialized successfully via worker');
    } catch (error: any) {
      console.error('[PythonRuntime] Initialization error:', error);
      throw new Error(`Failed to initialize Python: ${error.message || 'Unknown error'}`);
    }
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Python runtime not initialized');
    }

    const result: ExecutionResult = { output: '', datasets: [] };

    return new Promise((resolve) => {
      const listener = (evt: MessageEvent) => {
        const msg = evt.data;

        if (msg.type === 'stdout' || msg.type === 'stderr') {
          result.output += msg.text + '\n';
          onOutput(msg.text);
        } else if (msg.type === 'result') {
          if (msg.result !== undefined && msg.result !== null) {
            const outputStr = String(msg.result);
            result.output += outputStr + '\n';
            onOutput(outputStr);
          }
          this.worker?.removeEventListener('message', listener);
          resolve(result);
        } else if (msg.type === 'error') {
          result.error = msg.error;
          result.output += `Error: ${msg.error}\n`;
          onOutput(`Error: ${msg.error}`);
          this.worker?.removeEventListener('message', listener);
          resolve(result);
        }
      };

      this.worker!.addEventListener('message', listener);
      this.worker!.postMessage({ type: 'run', code });
    });
  }

  async installPackage(name: string): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Python runtime not initialized');
    }

    return new Promise((resolve, reject) => {
      const listener = (evt: MessageEvent) => {
        const msg = evt.data;
        
        if (msg.type === 'installed') {
          this.worker?.removeEventListener('message', listener);
          resolve();
        } else if (msg.type === 'error') {
          this.worker?.removeEventListener('message', listener);
          reject(new Error(msg.error));
        }
      };

      this.worker!.addEventListener('message', listener);
      this.worker!.postMessage({ type: 'install', name });
    });
  }

  checkCompatibility(code: string, isMobile: boolean): CompatibilityResult {
    const result = checkLibraryCompatibility(code, 'python', isMobile);
    return {
      compatible: result.isCompatible,
      warnings: result.warnings,
      suggestions: result.suggestions,
    };
  }
}
