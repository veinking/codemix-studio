import { RuntimeExecutor, RuntimeConfig, ExecutionResult } from './RuntimeInterface';

declare global {
  interface Window {
    PhpWeb?: {
      PhpWebShell: new () => {
        addEventListener(event: string, callback: (data: any) => void): void;
        run(code: string): Promise<void>;
        dispatchEvent(event: string, data: any): void;
      };
    };
  }
}

export class PHPRuntime implements RuntimeExecutor {
  config: RuntimeConfig = {
    name: 'php',
    displayName: 'PHP',
    fileExtensions: ['.php'],
    color: 'hsl(var(--chart-5))',
    supportsPackages: false,
    availableOn: 'all'
  };

  isInitialized = false;
  private shell: any = null;

  async initialize(isMobile: boolean): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load php-wasm
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/php-wasm@0.0.9/php-web.js';
      script.async = true;

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load PHP runtime'));
        document.head.appendChild(script);
      });

      // Wait for PhpWeb to be available
      let attempts = 0;
      while (!window.PhpWeb && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.PhpWeb) {
        throw new Error('PHP runtime not available');
      }

      this.shell = new window.PhpWeb.PhpWebShell();
      this.isInitialized = true;
      console.log('PHP runtime initialized');
    } catch (error) {
      console.error('Failed to initialize PHP:', error);
      throw error;
    }
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    if (!this.isInitialized || !this.shell) {
      throw new Error('PHP runtime not initialized');
    }

    let output = '';
    let hasError = false;

    try {
      // Set up output listener
      this.shell.addEventListener('output', (event: any) => {
        const text = event.detail;
        output += text + '\n';
        onOutput(text);
      });

      this.shell.addEventListener('error', (event: any) => {
        const text = event.detail;
        output += 'Error: ' + text + '\n';
        onOutput('Error: ' + text);
        hasError = true;
      });

      // Wrap code in PHP tags if not present
      const wrappedCode = code.trim().startsWith('<?php') ? code : `<?php\n${code}\n?>`;
      
      await this.shell.run(wrappedCode);

      return {
        output: output || 'Code executed successfully',
        error: hasError ? output : undefined
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        output: output || '',
        error: `PHP Error: ${errorMsg}`
      };
    }
  }
}
