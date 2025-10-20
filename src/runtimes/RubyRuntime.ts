import { RuntimeExecutor, RuntimeConfig, ExecutionResult } from './RuntimeInterface';

declare global {
  interface Window {
    ruby?: {
      vm: {
        eval(code: string): any;
        evalAsync(code: string): Promise<any>;
      };
    };
    rubyVM?: any;
  }
}

export class RubyRuntime implements RuntimeExecutor {
  config: RuntimeConfig = {
    name: 'ruby',
    displayName: 'Ruby',
    fileExtensions: ['.rb'],
    color: 'hsl(var(--destructive))',
    supportsPackages: false,
    availableOn: 'all'
  };

  isInitialized = false;

  async initialize(isMobile: boolean): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load ruby.wasm
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/ruby-3_2-wasm-wasi@2.5.0/dist/browser.script.iife.js';
      script.async = true;

      await new Promise<void>((resolve, reject) => {
        script.onload = async () => {
          // Wait for Ruby to initialize
          let attempts = 0;
          while (!window.rubyVM && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          if (window.rubyVM) {
            resolve();
          } else {
            reject(new Error('Ruby VM not initialized'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load Ruby runtime'));
        document.head.appendChild(script);
      });

      this.isInitialized = true;
      console.log('Ruby runtime initialized');
    } catch (error) {
      console.error('Failed to initialize Ruby:', error);
      throw error;
    }
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    if (!this.isInitialized || !window.rubyVM) {
      throw new Error('Ruby runtime not initialized');
    }

    try {
      // Capture output by wrapping code
      const wrappedCode = `
begin
  result = begin
    ${code}
  end
  result.to_s unless result.nil?
rescue => e
  "Error: #{e.class}: #{e.message}\\n#{e.backtrace.join("\\n")}"
end
      `.trim();

      const result = await window.rubyVM.eval(wrappedCode);
      const output = String(result || '');
      
      onOutput(output);

      const isError = output.startsWith('Error:');
      return {
        output: isError ? '' : output,
        error: isError ? output : undefined
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        output: '',
        error: `Ruby Error: ${errorMsg}`
      };
    }
  }
}
