import { RuntimeExecutor, RuntimeConfig, ExecutionResult, CompatibilityResult } from './RuntimeInterface';
import { checkLibraryCompatibility } from '@/utils/libraryCompatibility';

export class PythonRuntime implements RuntimeExecutor {
  private pyodide: any = null;
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

    const { loadPyodide } = await import('pyodide');
    
    const config: any = {
      stdout: (text: string) => console.log(text),
      stderr: (text: string) => console.error(text),
    };

    if (isMobile) {
      config.args = ['--no-threading'];
    }

    this.pyodide = await loadPyodide(config);
    
    await this.pyodide.loadPackage(['micropip', 'numpy', 'pandas']);
    
    this.isInitialized = true;
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    if (!this.isInitialized) {
      throw new Error('Python runtime not initialized');
    }

    const result: ExecutionResult = { output: '', datasets: [] };
    
    this.pyodide.setStdout({
      batched: (text: string) => {
        result.output += text + '\n';
        onOutput(text);
      }
    });

    this.pyodide.setStderr({
      batched: (text: string) => {
        result.output += text + '\n';
        onOutput(text);
      }
    });

    try {
      const output = await this.pyodide.runPythonAsync(code);
      
      if (output !== undefined && output !== null) {
        const outputStr = String(output);
        result.output += outputStr + '\n';
        onOutput(outputStr);
      }

      // Check for matplotlib plots
      const plotCode = `
import sys
import io
import base64
try:
    import matplotlib.pyplot as plt
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=150)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close('all')
    img_base64
except Exception as e:
    None
      `;
      
      const plotData = await this.pyodide.runPythonAsync(plotCode);
      if (plotData) {
        result.plotUrl = `data:image/png;base64,${plotData}`;
      }

    } catch (error: any) {
      result.error = error.message || String(error);
      result.output += `Error: ${result.error}\n`;
      onOutput(`Error: ${result.error}`);
    }

    return result;
  }

  async installPackage(name: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Python runtime not initialized');
    }

    await this.pyodide.runPythonAsync(`
import micropip
await micropip.install('${name}')
    `);
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
