import { RuntimeExecutor, RuntimeConfig, ExecutionResult, CompatibilityResult } from './RuntimeInterface';
import { checkLibraryCompatibility } from '@/utils/libraryCompatibility';

export class RRuntime implements RuntimeExecutor {
  private webR: any = null;
  public isInitialized = false;

  public config: RuntimeConfig = {
    name: 'r',
    displayName: 'R',
    fileExtensions: ['.r', '.R'],
    color: 'hsl(var(--chart-2))',
    supportsPackages: true,
    availableOn: 'all', // Now supports mobile with webR 0.3+
  };

  async initialize(isMobile: boolean): Promise<void> {
    if (this.isInitialized) return;

    // @ts-ignore - WebR loaded via CDN
    const { WebR } = await import('https://webr.r-wasm.org/latest/webr.mjs');
    
    // Configure for mobile with reduced memory footprint
    const config = isMobile ? {
      baseUrl: 'https://webr.r-wasm.org/latest/',
      serviceWorkerUrl: '',
      channelType: 'PostMessage' as const,
    } : {};
    
    this.webR = new WebR(config);
    await this.webR.init();
    
    this.isInitialized = true;
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    if (!this.isInitialized) {
      throw new Error('R runtime not initialized');
    }

    const result: ExecutionResult = { output: '', datasets: [] };

    try {
      const evalResult = await this.webR.evalR(code);
      const output = await evalResult.toJs();
      
      const outputStr = JSON.stringify(output, null, 2);
      result.output = outputStr;
      onOutput(outputStr);

      // Check for plots
      const plotCode = `
if (length(dev.list()) > 0) {
  tmp <- tempfile(fileext = '.png')
  dev.copy(png, tmp, width=800, height=600)
  dev.off()
  base64enc::base64encode(tmp)
} else {
  NA
}
      `;
      
      const plotResult = await this.webR.evalR(plotCode);
      const plotData = await plotResult.toJs();
      
      if (plotData && plotData !== 'NA') {
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
      throw new Error('R runtime not initialized');
    }

    await this.webR.evalR(`install.packages('${name}')`);
  }

  checkCompatibility(code: string, isMobile: boolean): CompatibilityResult {
    const result = checkLibraryCompatibility(code, 'r', isMobile);
    return {
      compatible: result.isCompatible,
      warnings: result.warnings,
      suggestions: result.suggestions,
    };
  }
}
