// Library compatibility checker for Pyodide and webR in browser/mobile environments

interface IncompatibleLibrary {
  name: string;
  reason: string;
  alternatives: string[];
}

// Python libraries that don't work in Pyodide
const PYTHON_INCOMPATIBLE: IncompatibleLibrary[] = [
  {
    name: "tkinter",
    reason: "GUI library that requires native desktop environment",
    alternatives: ["Use matplotlib for plots", "Use Plotly for interactive visualizations", "Use ipywidgets for simple UI elements"]
  },
  {
    name: "PyQt5",
    reason: "Desktop GUI framework not available in browser",
    alternatives: ["Use matplotlib", "Use Plotly", "Use web-based UI instead"]
  },
  {
    name: "PyQt6",
    reason: "Desktop GUI framework not available in browser",
    alternatives: ["Use matplotlib", "Use Plotly", "Use web-based UI instead"]
  },
  {
    name: "turtle",
    reason: "Turtle graphics requires tkinter",
    alternatives: ["Use matplotlib for drawings", "Use Plotly for interactive graphics"]
  },
  {
    name: "threading",
    reason: "Thread-based parallelism not fully supported in Pyodide",
    alternatives: ["Use asyncio for async operations", "Restructure code to be single-threaded"]
  },
  {
    name: "multiprocessing",
    reason: "Process-based parallelism not available in browser",
    alternatives: ["Use asyncio", "Break into smaller sequential tasks"]
  },
  {
    name: "sqlite3",
    reason: "Native SQLite not available (use sql.js or indexedDB instead)",
    alternatives: ["Use micropip to install sqlite3 wheel", "Use in-memory data structures", "Use pandas DataFrames"]
  },
  {
    name: "cv2",
    reason: "OpenCV requires native libraries",
    alternatives: ["Use Pillow (PIL) for image processing", "Use scikit-image for some computer vision tasks"]
  },
  {
    name: "pygame",
    reason: "Game library requires native graphics",
    alternatives: ["Use web canvas API", "Use matplotlib for simple animations"]
  }
];

// R libraries that don't work in webR
const R_INCOMPATIBLE: IncompatibleLibrary[] = [
  {
    name: "shiny",
    reason: "Interactive web framework requires server (not fully supported in webR yet)",
    alternatives: ["Use static plots with ggplot2", "Use plotly for interactivity"]
  },
  {
    name: "parallel",
    reason: "Parallel processing not available in browser",
    alternatives: ["Use sequential processing", "Optimize with vectorization"]
  },
  {
    name: "future",
    reason: "Async execution not fully supported in webR",
    alternatives: ["Use synchronous code", "Break into smaller tasks"]
  }
];

export function checkLibraryCompatibility(code: string, language: string, isMobile: boolean): {
  isCompatible: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  const incompatibleList = language === 'python' ? PYTHON_INCOMPATIBLE : R_INCOMPATIBLE;
  
  // Check for import/library statements
  const importPatterns = language === 'python' 
    ? [/import\s+(\w+)/, /from\s+(\w+)\s+import/]
    : [/library\(([^)]+)\)/, /require\(([^)]+)\)/];
  
  const lines = code.split('\n');
  const foundIncompatible: IncompatibleLibrary[] = [];
  
  for (const line of lines) {
    for (const pattern of importPatterns) {
      const match = line.match(pattern);
      if (match) {
        const libName = match[1].replace(/['"]/g, '');
        const incompatible = incompatibleList.find(lib => 
          lib.name.toLowerCase() === libName.toLowerCase()
        );
        
        if (incompatible && !foundIncompatible.includes(incompatible)) {
          foundIncompatible.push(incompatible);
        }
      }
    }
  }
  
  // Generate warnings and suggestions
  for (const lib of foundIncompatible) {
    warnings.push(
      `⚠️ "${lib.name}" is not compatible: ${lib.reason}`
    );
    suggestions.push(
      `💡 Alternatives for "${lib.name}": ${lib.alternatives.join(', ')}`
    );
  }
  
  // Mobile-specific warnings
  if (isMobile && code.length > 10000) {
    warnings.push("⚠️ Large code file detected - may cause performance issues on mobile");
    suggestions.push("💡 Consider breaking into smaller functions or reducing complexity");
  }
  
  // Check for potentially heavy operations on mobile
  if (isMobile && language === 'python') {
    if (code.includes('for') && code.includes('range')) {
      const matches = code.match(/range\((\d+)\)/g);
      if (matches) {
        const largeLoops = matches.filter(m => {
          const num = parseInt(m.match(/\d+/)?.[0] || '0');
          return num > 100000;
        });
        
        if (largeLoops.length > 0) {
          warnings.push("⚠️ Large loops detected - may be slow on mobile devices");
          suggestions.push("💡 Use NumPy vectorization instead of loops for better performance");
        }
      }
    }
  }
  
  return {
    isCompatible: foundIncompatible.length === 0,
    warnings,
    suggestions
  };
}

export function getCompatibilityMessage(result: ReturnType<typeof checkLibraryCompatibility>): string {
  if (result.isCompatible && result.warnings.length === 0) {
    return "✓ Code looks compatible with browser environment";
  }
  
  const messages: string[] = [];
  
  if (result.warnings.length > 0) {
    messages.push("Compatibility Issues Found:\n" + result.warnings.join('\n'));
  }
  
  if (result.suggestions.length > 0) {
    messages.push("\n" + result.suggestions.join('\n'));
  }
  
  return messages.join('\n');
}
