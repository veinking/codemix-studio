import { RuntimeExecutor, RuntimeConfig, ExecutionResult, CompatibilityResult } from './RuntimeInterface';
import { checkLibraryCompatibility } from '@/utils/libraryCompatibility';

export class RRuntime implements RuntimeExecutor {
  private webR: any | null = null;
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

    // Pin a version; "latest" can change/break
    // @ts-ignore - WebR loaded via CDN
    const { WebR } = await import('https://webr.r-wasm.org/v0.3.3/webr.mjs');
    
    // Configure for mobile with reduced memory footprint
    const config: any = isMobile
      ? {
          baseUrl: 'https://webr.r-wasm.org/v0.3.3/',
          channelType: 'PostMessage' as const,
          serviceWorkerUrl: '', // disable SW on iOS
        }
      : { baseUrl: 'https://webr.r-wasm.org/v0.3.3/' };
    
    this.webR = new WebR(config);
    await this.webR.init();
    
    // Pre-load plot dependencies for better reliability
    try {
      await this.webR.evalR(`
        if (!requireNamespace('base64enc', quietly = TRUE)) {
          install.packages('base64enc', quiet = TRUE, repos = 'https://cran.r-project.org')
        }
      `);
      console.log('[RRuntime] Plot dependencies loaded');
    } catch (e) {
      console.warn('[RRuntime] Could not pre-load plot dependencies:', e);
    }
    
    this.isInitialized = true;
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    if (!this.isInitialized || !this.webR) {
      throw new Error('R runtime not initialized');
    }

    const result: ExecutionResult = { output: '', datasets: [] };

    try {
      const captureCode = `
tryCatch({
  paste(capture.output({
${code}
  }), collapse = "\\n")
}, error = function(e) paste("Error:", conditionMessage(e)))`;

      const evalResult = await this.webR.evalR(captureCode);
      const output = await evalResult.toJs();

      // Normalize captured console output
      let outputStr = '';
      if (typeof output === 'string') {
        outputStr = output;
      } else if (output && typeof output === 'object' && output.type === 'character' && Array.isArray((output as any).values)) {
        outputStr = (output as any).values.join('\n');
      } else if (Array.isArray(output)) {
        outputStr = (output as any[]).join('\n');
      }

      if (outputStr && outputStr.trim().length > 0) {
        result.output = outputStr;
        onOutput(outputStr);
      }

      // Heuristic: only attempt plot capture if code likely produced a plot
      // Strip simple comments to avoid false positives
      const codeNoComments = code
        .split('\n')
        .map(l => l.replace(/#.*/, ''))
        .join('\n');
      // More specific plot detection - match ggplot() or base R plotting functions
      const likelyPlots = /(ggplot\s*\(|plot\s*\((?!.*function)|hist\s*\(|barplot\s*\(|boxplot\s*\(|image\s*\(|heatmap\s*\(|pairs\s*\(|matplot\s*\()/i.test(codeNoComments);

      // Check for plots only if code likely plots and graphics devices are active
      if (likelyPlots) {
        try {
          const hasDevices = await this.webR.evalR('length(dev.list()) > 0');
          const hasDevicesValue = await hasDevices.toJs();
          
          if (hasDevicesValue) {
            // Only try to capture if base64enc is available
            const plotCode = `
tryCatch({
  if (requireNamespace('base64enc', quietly = TRUE)) {
    tmp <- tempfile(fileext = '.png')
    dev.copy(png, tmp, width=800, height=600)
    dev.off()
    enc <- base64enc::base64encode(tmp)
    if (!is.na(file.info(tmp)$size) && file.info(tmp)$size > 1500) enc else NA
  } else {
    NA
  }
}, error = function(e) NA)
            `;
            
            const plotResult = await this.webR.evalR(plotCode);
            const plotData = await plotResult.toJs();
            
            if (plotData && plotData !== 'NA' && typeof plotData === 'string' && plotData.length > 2000) {
              result.plotUrl = `data:image/png;base64,${plotData}`;
            }
          }
        } catch (plotError) {
          // Silently ignore plot capture errors - not critical
          console.debug('Plot capture skipped:', plotError);
        }
      }

    } catch (error: any) {
      result.error = error.message || String(error);
      result.output += `Error: ${result.error}\n`;
      onOutput(`Error: ${result.error}`);
    }

    return result;
  }

  async installPackage(name: string): Promise<void> {
    if (!this.isInitialized || !this.webR) {
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
