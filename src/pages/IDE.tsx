import React, { useState, useEffect, useMemo } from "react";
import Papa from 'papaparse';
import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor";
import { ConsolePanel } from "@/components/ConsolePanel";
import { Toolbar } from "@/components/Toolbar";
import { DatasetViewer } from "@/components/DatasetViewer";
import DataLab from "@/components/DataLab";
import { PlotViewer } from "@/components/PlotViewer";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { DesktopLayout } from "@/components/layouts/DesktopLayout";
import { AIAssistant } from "@/components/AIAssistant";
import { LabTrainer } from "@/components/LabTrainer";
import { DataOperations } from "@/components/DataOperations";
import { MLOperations } from "@/components/MLOperations";
import { WelcomeOverlay } from "@/components/WelcomeOverlay";
import { PackageManager } from "@/components/PackageManager";
import { FeatureDrawer } from "@/components/FeatureDrawer";
import { SidePanel } from "@/components/SidePanel";
import { TranslateDialog } from "@/components/TranslateDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { Button } from "@/components/ui/button";
import { useIndexedDB } from "@/hooks/useIndexedDB";
import { useDeviceType } from "@/hooks/useDeviceType";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { getCompatibilityMessage } from "@/utils/libraryCompatibility";
import { RuntimeRegistry } from "@/runtimes/RuntimeRegistry";
import { PythonRuntime } from "@/runtimes/PythonRuntime";
import { RRuntime } from "@/runtimes/RRuntime";
import { JavaScriptRuntime } from "@/runtimes/JavaScriptRuntime";
import { SQLRuntime } from "@/runtimes/SQLRuntime";
import { supabase } from "@/integrations/supabase/client";

interface ErrorExplanation {
  what: string;
  why: string;
  fix: string;
  concepts: string[];
}

interface ConsoleMessage {
  text: string;
  explanation?: ErrorExplanation;
  isError?: boolean;
}

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content: string;
  language: 'python' | 'r' | 'javascript' | 'sql' | 'csv' | 'plaintext';
}

interface Dataset {
  headers: string[];
  data: string[][];
}

const IDE = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [plainEnglishMode, setPlainEnglishMode] = useState(() => {
    return localStorage.getItem('plainEnglishMode') === 'true';
  });
  const [errorExplanationCache, setErrorExplanationCache] = useState<Map<string, ErrorExplanation>>(new Map());
  const [datasets, setDatasets] = useState<Map<string, Dataset>>(new Map());
  const [showDataset, setShowDataset] = useState<string | null>(null);
  const [plotData, setPlotData] = useState<string | null>(null);
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [labTrainerOpen, setLabTrainerOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [initializedRuntimes, setInitializedRuntimes] = useState<Set<string>>(new Set());
  const [featureDrawerOpen, setFeatureDrawerOpen] = useState(false);
  const [translateDialogOpen, setTranslateDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [csvViewMode, setCsvViewMode] = useState<'data' | 'code'>('data'); // Toggle between data view and code view
  const [sidePanelOpen, setSidePanelOpen] = useState(() => {
    return localStorage.getItem('sidePanelOpen') === 'true';
  });
  
  // Per-language code storage (scratch pad per language)
  const [languageCode, setLanguageCode] = useState<{
    python: string;
    r: string;
    javascript: string;
    sql: string;
  }>(() => {
    const stored = sessionStorage.getItem('languageCode');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return { python: '', r: '', javascript: '', sql: '' };
      }
    }
    return { python: '', r: '', javascript: '', sql: '' };
  });
  
  // Scratch pad state (not saved to files, only sessionStorage)
  const [scratchCode, setScratchCode] = useState<string>(() => {
    return languageCode.python || sessionStorage.getItem('scratchCode') || '';
  });
  const [scratchLanguage, setScratchLanguage] = useState<'python' | 'r' | 'javascript' | 'sql'>(() => {
    return (sessionStorage.getItem('scratchLanguage') as any) || 'python';
  });
  
  const { saveFile, loadFiles, deleteFile, isReady: dbReady } = useIndexedDB();
  const { isMobile, deviceType } = useDeviceType();

  // Persist language code to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('languageCode', JSON.stringify(languageCode));
  }, [languageCode]);

  // Persist scratch to sessionStorage (legacy support)
  useEffect(() => {
    sessionStorage.setItem('scratchCode', scratchCode);
  }, [scratchCode]);

  useEffect(() => {
    sessionStorage.setItem('scratchLanguage', scratchLanguage);
  }, [scratchLanguage]);

  // When switching languages, save current code and load new language's code
  const handleLanguageChange = (newLang: 'python' | 'r' | 'javascript' | 'sql') => {
    // Save current language code
    setLanguageCode(prev => ({
      ...prev,
      [scratchLanguage]: scratchCode
    }));
    
    // Switch to new language
    setScratchLanguage(newLang);
    
    // Load new language's code
    setScratchCode(languageCode[newLang]);
  };

  // Register all runtimes on mount
  useEffect(() => {
    RuntimeRegistry.register(new PythonRuntime());
    RuntimeRegistry.register(new RRuntime());
    RuntimeRegistry.register(new JavaScriptRuntime());
    RuntimeRegistry.register(new SQLRuntime());
  }, []);

  // First-run experience
  useEffect(() => {
    const isFirstVisit = !localStorage.getItem('openide_visited');
    if (isFirstVisit) {
      setShowWelcome(true);
      localStorage.setItem('openide_visited', 'true');
      
      // Create demo files
      const demoFiles: FileItem[] = [
        {
          id: 'demo-py',
          name: 'demo.py',
          type: 'file',
          language: 'python',
          content: `# Welcome to OpenIDE!
# This is a simple Python demo

import matplotlib.pyplot as plt

# Simple calculation
numbers = [1, 2, 3, 4, 5]
squares = [n ** 2 for n in numbers]

print("Numbers:", numbers)
print("Squares:", squares)

# Create a plot
plt.figure(figsize=(8, 5))
plt.plot(numbers, squares, marker='o', color='#a855f7')
plt.title('Squares of Numbers')
plt.xlabel('Number')
plt.ylabel('Square')
plt.grid(True, alpha=0.3)
plt.show()

print("✓ Demo complete! Try editing this code or create your own files.")`,
        },
        {
          id: 'demo-js',
          name: 'demo.js',
          type: 'file',
          language: 'javascript',
          content: `// JavaScript Demo - Welcome to OpenIDE!

const greet = (name) => {
  return \`Hello, \${name}! Welcome to OpenIDE.\`;
};

console.log(greet("World"));

// Array methods
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);

// Async/await example
async function fetchData() {
  console.log("Fetching data...");
  return { status: "success", data: [10, 20, 30] };
}

fetchData().then(result => {
  console.log("Result:", result);
});

console.log("✓ JavaScript demo complete!");`,
        },
        {
          id: 'demo-sql',
          name: 'demo.sql',
          type: 'file',
          language: 'sql',
          content: `-- SQL Demo - Welcome to OpenIDE!

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  city TEXT
);

INSERT INTO users (name, age, city) VALUES
  ('Alice', 28, 'New York'),
  ('Bob', 34, 'San Francisco'),
  ('Charlie', 23, 'Los Angeles');

SELECT * FROM users;

SELECT name, age FROM users WHERE age > 25 ORDER BY age DESC;`,
        },
        {
          id: 'demo-csv',
          name: 'sample.csv',
          type: 'file',
          language: 'csv',
          content: `Name,Age,City,Score
Alice,28,New York,95
Bob,34,San Francisco,87
Charlie,23,Los Angeles,92
Diana,31,Chicago,88
Eve,27,Boston,90
Frank,29,Seattle,85
Grace,25,Austin,93
Henry,33,Denver,89
Ivy,26,Portland,91
Jack,30,Miami,86`,
        },
      ];
      
      setFiles(demoFiles);
      setActiveFile('demo-py');
      
      // Parse the demo CSV
      const csvFile = demoFiles.find(f => f.name === 'sample.csv');
      if (csvFile) {
        parseCSV(csvFile.content, csvFile.name);
      }
    }
  }, []);

  // Load files from IndexedDB on mount
  useEffect(() => {
    const loadStoredFiles = async () => {
      if (!dbReady) return;
      
      try {
        const storedFiles = await loadFiles();
        if (storedFiles.length > 0) {
          // Cast stored files to FileItem with proper language types
          const typedFiles = storedFiles.map(f => ({
            ...f,
            language: f.language as FileItem['language']
          }));
          setFiles(typedFiles);
          toast.success(`Loaded ${storedFiles.length} file(s) from storage`);
        }
      } catch (error) {
        console.error("Error loading files:", error);
      }
    };
    
    loadStoredFiles();
  }, [dbReady]);

  const addToConsole = (message: string, isError: boolean = false) => {
    setConsoleOutput((prev) => [...prev, { text: message, isError }]);
  };

  const addErrorWithExplanation = async (errorMessage: string, code: string, language: string) => {
    // Check cache first
    if (errorExplanationCache.has(errorMessage)) {
      const explanation = errorExplanationCache.get(errorMessage)!;
      setConsoleOutput((prev) => [...prev, { 
        text: errorMessage, 
        isError: true, 
        explanation 
      }]);
      return;
    }

    // Add error immediately with "analyzing" placeholder
    setConsoleOutput((prev) => [...prev, { 
      text: errorMessage, 
      isError: true 
    }]);

    if (!plainEnglishMode) return;

    try {
      // Show analyzing message
      const analyzingIndex = consoleOutput.length;
      setConsoleOutput((prev) => [...prev, { text: "🔍 Analyzing error..." }]);

      const { data, error } = await supabase.functions.invoke('explain-error', {
        body: {
          error: errorMessage,
          code: code.substring(0, 1000), // Limit code context
          language,
        }
      });

      // Remove analyzing message
      setConsoleOutput((prev) => prev.filter((_, i) => i !== analyzingIndex));

      if (error) {
        console.error('Error explaining error:', error);
        return;
      }

      if (data?.explanation) {
        // Cache the explanation
        setErrorExplanationCache((prev) => new Map(prev).set(errorMessage, data.explanation));
        
        // Update the error message with explanation
        setConsoleOutput((prev) => 
          prev.map((msg, i) => 
            i === analyzingIndex - 1 && msg.text === errorMessage
              ? { ...msg, explanation: data.explanation }
              : msg
          )
        );
      }
    } catch (err) {
      console.error('Failed to get error explanation:', err);
      // Remove analyzing message on error
      setConsoleOutput((prev) => prev.filter(msg => msg.text !== "🔍 Analyzing error..."));
    }
  };

  const togglePlainEnglishMode = () => {
    const newMode = !plainEnglishMode;
    setPlainEnglishMode(newMode);
    localStorage.setItem('plainEnglishMode', String(newMode));
    toast.success(newMode ? 'Plain English Mode enabled' : 'Plain English Mode disabled');
  };

  const getLanguageFromFileName = (fileName: string): 'python' | 'r' | 'javascript' | 'sql' | 'csv' | 'plaintext' => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'csv') return 'csv';
    
    const detected = RuntimeRegistry.detectLanguage(fileName);
    if (detected === 'javascript' || detected === 'sql' || detected === 'r') return detected;
    if (detected === 'python') return 'python';
    
    return 'plaintext';
  };

  const handleCreateFile = async (name: string, content: string) => {
    const language = getLanguageFromFileName(name);
    
    const newFile: FileItem = {
      id: `${Date.now()}`,
      name,
      type: 'file',
      content,
      language,
    };
    
    setFiles((prev) => [...prev, newFile]);
    setActiveFile(newFile.id);
    
    // Save to IndexedDB
    if (dbReady) {
      await saveFile(newFile);
    }
    
    toast.success(`Created ${name}`);
    addToConsole(`✓ Created new file: ${name}`);
  };

  const handleFileUpload = async (fileList: FileList) => {
    const newFiles: FileItem[] = [];
    
    // Check file size on mobile (warn if >5MB)
    const maxSize = isMobile ? 5 * 1024 * 1024 : 20 * 1024 * 1024; // 5MB mobile, 20MB desktop
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds ${isMobile ? '5MB' : '20MB'} limit. Skipping.`);
        continue;
      }
      
      const content = await file.text();
      const language = getLanguageFromFileName(file.name);
      
      const fileItem: FileItem = {
        id: `${Date.now()}-${i}`,
        name: file.name,
        type: 'file',
        content,
        language,
      };
      
      // If CSV, parse and store as dataset
      if (language === 'csv') {
        parseCSV(content, file.name);
        addToConsole(`✓ Dataset loaded: ${file.name}`);
      }
      
      newFiles.push(fileItem);
      
      // Save to IndexedDB with quota handling
      if (dbReady) {
        try {
          await saveFile(fileItem);
        } catch (error: any) {
          if (error?.message === "STORAGE_FULL") {
            toast.error("Storage full. File won't persist after reload.", {
              duration: 5000,
            });
          } else {
            throw error;
          }
        }
      }
    }
    
    setFiles((prev) => [...prev, ...newFiles]);
    if (newFiles.length > 0) {
      setActiveFile(newFiles[0].id);
      toast.success(`Uploaded ${newFiles.length} file(s)`);
    }
  };

  const parseCSV = (content: string, fileName: string) => {
    try {
      // Prefer Papa Parse for robustness
      const res = Papa.parse<Record<string, any>>(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
      const headers = res.meta.fields || Object.keys(res.data[0] || {});
      const data = (res.data as any[]).map(row => headers.map(h => String(row?.[h] ?? '')));
      setDatasets(prev => new Map(prev).set(fileName, { headers, data }));
      addToConsole(`✓ Loaded ${fileName}: ${data.length} rows × ${headers.length} columns`);
    } catch (e) {
      // Fallback to naive parser
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length === 0) return;
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim())
      );
      setDatasets(prev => new Map(prev).set(fileName, { headers, data }));
      addToConsole(`✓ Loaded ${fileName}: ${data.length} rows × ${headers.length} columns`);
    }
  };

  const handleFileSelect = (fileId: string) => {
    setActiveFile(fileId);
    const file = files.find(f => f.id === fileId);
    if (file && file.language === 'csv') {
      // Ensure dataset exists when opening previously saved CSVs
      const hasDataset = datasets.has(file.name);
      if (!hasDataset) {
        parseCSV(file.content, file.name);
      }
      setShowDataset(file.name);
      setCsvViewMode('data'); // Default to data view when opening CSV
      // Ensure scratch editor cleared to avoid confusion
      setScratchCode(prev => prev);
    } else {
      setShowDataset(null);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.language === 'csv') {
      setDatasets(prev => {
        const newMap = new Map(prev);
        newMap.delete(file.name);
        return newMap;
      });
    }
    
    if (dbReady) {
      await deleteFile(fileId);
    }
    
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (activeFile === fileId) {
      setActiveFile(null);
      setShowDataset(null);
    }
    toast.success("File deleted");
  };

  const handleSaveAll = async () => {
    if (!dbReady) {
      toast.error("Database not ready");
      return;
    }
    
    try {
      for (const file of files) {
        await saveFile(file);
      }
      toast.success("All files saved!");
    } catch (error) {
      toast.error("Error saving files");
    }
  };

  const handleCodeChange = async (value: string | undefined) => {
    if (!value) return;
    
    // If no file is active, update scratch pad
    if (!activeFile) {
      setScratchCode(value);
      return;
    }
    
    // Otherwise update the active file
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === activeFile) {
          const updated = { ...f, content: value };
          // Auto-save to IndexedDB with quota handling
          if (dbReady) {
            saveFile(updated).catch((error: any) => {
              if (error?.message === "STORAGE_FULL") {
                // Silent handling - already in sessionStorage fallback
                console.warn("Storage full, using session storage");
              }
            });
          }
          return updated;
        }
        return f;
      })
    );
  };

  const installPackage = async (packageName: string): Promise<void> => {
    const language = activeFile
      ? (files.find(f => f.id === activeFile)?.language || 'python')
      : scratchLanguage;

    const runtime = RuntimeRegistry.get(language);
    
    if (!runtime) {
      toast.error(`No runtime found for ${language}`);
      return;
    }

    if (!runtime.config.supportsPackages) {
      toast.error(`${runtime.config.displayName} does not support package installation`);
      return;
    }

    if (!runtime.installPackage) {
      toast.error(`Package installation not implemented for ${runtime.config.displayName}`);
      return;
    }

    setIsInstalling(true);
    addToConsole(`>>> Installing ${packageName}...`);
    
    try {
      await runtime.installPackage(packageName);
      setInstalledPackages(prev => [...prev, packageName]);
      addToConsole(`✓ ${packageName} installed successfully`);
      toast.success(`${packageName} installed!`);
    } catch (error: any) {
      addToConsole(`✗ Error installing ${packageName}: ${error.message}`);
      toast.error(`Failed to install ${packageName}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRunCode = async () => {
    setConsoleOutput([]);
    setPlotData(null);
    setIsRunning(true);

    // Determine code and language
    let code: string;
    let language: 'python' | 'r' | 'javascript' | 'sql';

    if (currentFile && currentFile.language === 'csv') {
      // When a CSV is active, allow running the scratch editor when in "Write Code" mode
      if (csvViewMode === 'code') {
        code = scratchCode;
        language = scratchLanguage;
      } else {
        addToConsole("✗ This is a CSV preview. Switch to 'Write Code' to run Python or R.");
        setIsRunning(false);
        return;
      }
    } else {
      code = activeFile ? (currentFile?.content || '') : scratchCode;
      language = activeFile ? ((currentFile?.language as any) || 'python') : scratchLanguage;
    }

    // Block running plain text
    if ((language as any) === 'plaintext') {
      addToConsole("✗ Cannot run plain text files.");
      setIsRunning(false);
      return;
    }

    // Get the runtime
    const runtime = RuntimeRegistry.get(language);
    
    if (!runtime) {
      addToConsole(`✗ Error: No runtime found for ${language}`);
      setIsRunning(false);
      return;
    }

    // Check device compatibility
    if (runtime.config.availableOn === 'desktop' && isMobile) {
      addToConsole(`✗ Error: ${runtime.config.displayName} is only available on desktop`);
      setIsRunning(false);
      return;
    }

    // Check library compatibility (if supported)
    if (runtime.checkCompatibility) {
      const compat = runtime.checkCompatibility(code, isMobile);
      if (!compat.compatible || compat.warnings.length > 0) {
        const compatMessage = getCompatibilityMessage({
          isCompatible: compat.compatible,
          warnings: compat.warnings,
          suggestions: compat.suggestions
        });
        addToConsole(compatMessage);
        
        if (!compat.compatible) {
          addToConsole("\n✗ Code cannot run due to incompatible libraries");
          setIsRunning(false);
          return;
        }
      }
    }

    // Lazy initialize runtime
    if (!runtime.isInitialized) {
      const toastId = toast.loading(`Initializing ${runtime.config.displayName}...`);
      try {
        await runtime.initialize(isMobile);
        setInitializedRuntimes(prev => new Set(prev).add(language));
        addToConsole(`✓ ${runtime.config.displayName} environment ready!`);
        toast.success(`${runtime.config.displayName} ready`, { id: toastId });
      } catch (error: any) {
        addToConsole(`✗ Error initializing ${runtime.config.displayName}: ${error.message}`);
        toast.error(`Failed to load ${runtime.config.displayName}`, { id: toastId });
        setIsRunning(false);
        return;
      }
    }

    // Execute code
    addToConsole(`>>> Running ${runtime.config.displayName} code...`);
    
    try {
      const result = await runtime.execute(code, (output) => {
        addToConsole(output);
      });

      // Handle plots
      if (result.plotUrl) {
        setPlotData(result.plotUrl);
      }

      // Handle datasets (for SQL queries)
      if (result.datasets && result.datasets.length > 0) {
        result.datasets.forEach(ds => {
          setDatasets(prev => new Map(prev).set(ds.name, {
            headers: ds.headers,
            data: ds.data
          }));
        });
      }

      addToConsole(">>> Execution completed ✓");
    } catch (error: any) {
      const errorMessage = `✗ Error: ${error.message}`;
      await addErrorWithExplanation(errorMessage, code, language);
    } finally {
      setIsRunning(false);
    }
  };


  const handleDownload = () => {
    if (!activeFile) {
      // Download scratch content
      const ext = scratchLanguage === 'python' ? 'py' : 'r';
      const blob = new Blob([scratchCode], { type: "text/plain;charset=utf-8" });
      saveAs(blob, `scratch.${ext}`);
      toast.success(`Downloaded scratch.${ext}`);
      return;
    }
    
    const file = files.find((f) => f.id === activeFile);
    if (!file) return;
    
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, file.name);
    toast.success(`Downloaded ${file.name}`);
  };

  const handleSaveScratchAsFile = async () => {
    const ext = scratchLanguage === 'python' ? 'py' : 'r';
    const fileName = prompt('Enter file name:', `untitled.${ext}`);
    if (!fileName) return;
    
    await handleCreateFile(fileName, scratchCode);
    toast.success(`Saved as ${fileName}`);
  };

  const handleCopyAll = () => {
    const codeToCopy = activeFile 
      ? (files.find((f) => f.id === activeFile)?.content || '')
      : scratchCode;
    
    navigator.clipboard.writeText(codeToCopy).then(() => {
      toast.success('Code copied to clipboard');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy code');
    });
  };

  const handleLoadLabIntoEditor = (content: string, title: string) => {
    handleCreateFile(title, content);
    setLabTrainerOpen(false);
  };

  const handleCSVUpload = async (file: File) => {
    // Check file size on mobile
    const maxSize = isMobile ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    
    if (file.size > maxSize) {
      toast.error(`CSV exceeds ${isMobile ? '5MB' : '20MB'}. Large datasets may cause memory issues on mobile.`, {
        duration: 5000,
      });
      return;
    }
    
    const content = await file.text();
    const language = getLanguageFromFileName(file.name);
    
    const fileItem: FileItem = {
      id: `${Date.now()}`,
      name: file.name,
      type: 'file',
      content,
      language,
    };
    
    // Parse and store as dataset
    parseCSV(content, file.name);
    addToConsole(`✓ Dataset loaded: ${file.name}`);
    
    setFiles((prev) => [...prev, fileItem]);
    setActiveFile(fileItem.id);
    
    if (dbReady) {
      try {
        await saveFile(fileItem);
      } catch (error: any) {
        if (error?.message === "STORAGE_FULL") {
          toast.error("Storage full. File won't persist after reload.", {
            duration: 5000,
          });
        }
      }
    }
    
    toast.success(`Loaded ${file.name}`);
  };

  const handleInsertCode = (code: string) => {
    // If viewing a CSV, always insert into scratch pad, not the CSV file
    if (activeFile) {
      const file = files.find((f) => f.id === activeFile);
      if (file && file.language === 'csv') {
        // Insert into scratch pad for CSV files
        setScratchCode((prev) => prev + '\n\n' + code);
        // Auto-switch to code view so user can see the inserted code
        setCsvViewMode('code');
        toast.success('Code inserted into editor');
        return;
      } else if (file) {
        // Insert into regular code files
        const updatedContent = file.content + '\n\n' + code;
        handleCodeChange(updatedContent);
        return;
      }
    }
    // Insert into scratch pad if no file
    setScratchCode((prev) => prev + '\n\n' + code);
  };

  const handleTranslatedCode = (code: string, language: 'python' | 'r' | 'javascript' | 'sql') => {
    if (activeFile) {
      // If file is active, replace its content and update language
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile
            ? { ...f, content: code, language: language }
            : f
        )
      );
    } else {
      // If in scratch pad, replace scratch code and switch language
      setScratchCode(code);
      setScratchLanguage(language);
    }
  };

  const currentFile = files.find((f) => f.id === activeFile);
  const currentDataset = showDataset ? datasets.get(showDataset) : null;

  // Prepare components
  const toolbarComponent = (
    <Toolbar
      onRun={handleRunCode}
      onDownload={handleDownload}
      onSaveScratchAsFile={handleSaveScratchAsFile}
      onCopyAll={handleCopyAll}
      onShare={() => setShareDialogOpen(true)}
      onOpenTranslate={() => setTranslateDialogOpen(true)}
      currentFile={activeFile}
      isRunning={isRunning}
      scratchLanguage={scratchLanguage}
      onScratchLanguageChange={handleLanguageChange}
      onInsertCode={handleInsertCode}
      onOpenFeatures={() => setFeatureDrawerOpen(true)}
      onOpenTools={() => setSidePanelOpen(prev => !prev)}
      initializedRuntimes={initializedRuntimes}
      isMobile={isMobile}
    />
  );

  const packageManagerComponent = (
    <PackageManager
      installedPackages={installedPackages}
      onInstallPackage={installPackage}
      isInstalling={isInstalling}
      currentLanguage={
        currentFile?.language === 'python' || currentFile?.language === 'r' || 
        currentFile?.language === 'javascript' || currentFile?.language === 'sql'
          ? currentFile.language
          : scratchLanguage
      }
    />
  );

  const labTrainerComponent = (
    <LabTrainer 
      open={labTrainerOpen} 
      onOpenChange={setLabTrainerOpen}
      onLoadLab={handleLoadLabIntoEditor}
    />
  );

  const fileExplorerComponent = (
    <FileExplorer
      files={files}
      activeFile={activeFile}
      onFileSelect={handleFileSelect}
      onFileUpload={handleFileUpload}
      onFileDelete={handleFileDelete}
      onCreateFile={handleCreateFile}
      onSaveAll={handleSaveAll}
      installedPackages={installedPackages}
      onInstallPackage={installPackage}
      isInstalling={isInstalling}
      onOpenLabTrainer={() => setLabTrainerOpen(true)}
    />
  );

  const preloadedFromCSV = useMemo(() => {
    if (currentFile?.language !== 'csv') return undefined;
    if (currentDataset) {
      return {
        rows: currentDataset.data.map((row) =>
          currentDataset.headers.reduce((obj, header, j) => {
            obj[header] = row[j];
            return obj;
            }, {} as Record<string, any>)
        ),
        filename: currentFile.name,
      };
    }
    try {
      const res = Papa.parse<Record<string, any>>(currentFile.content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
      const rows = (res.data as any[]).filter(r => r && Object.keys(r).length > 0);
      if (rows.length > 0) {
        return { rows, filename: currentFile.name };
      }
    } catch {}
    return undefined;
  }, [currentFile, currentDataset]);

  const dataLabComponent = (
    <DataLab
      onLoadDataset={(rows, name) => {
        const headers = Object.keys(rows[0] || {});
        const data = rows.map(row => headers.map(h => String(row[h] ?? '')));
        setDatasets(prev => new Map(prev).set(name, { headers, data }));
        setShowDataset(name);
        toast.success(`Loaded ${name} dataset`);
      }}
      onInsertCode={handleInsertCode}
      language={scratchLanguage === 'r' ? 'r' : 'python'}
      preloadedData={preloadedFromCSV}
    />
  );

  const editorComponent = currentFile ? (
    currentFile.language === 'csv' ? (
      <div className="h-full flex flex-col">
        {/* CSV Toggle Bar */}
        <div className="flex items-center gap-2 p-2 bg-toolbar border-b border-border">
          <Button
            variant={csvViewMode === 'data' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCsvViewMode('data')}
          >
            View Data
          </Button>
          <Button
            variant={csvViewMode === 'code' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCsvViewMode('code')}
          >
            Write Code
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">
            {currentFile.name}
          </span>
        </div>
        
        {/* Content based on view mode */}
        <div className="flex-1 overflow-auto">
          {csvViewMode === 'data' ? (
            <div className="h-full overflow-auto flex flex-col gap-4 p-2">
              {currentDataset && (
                <DatasetViewer
                  headers={currentDataset.headers}
                  data={currentDataset.data}
                />
              )}
              {dataLabComponent}
            </div>
          ) : (
            <CodeEditor
              value={scratchCode}
              language={scratchLanguage}
              onChange={(value) => setScratchCode(value || '')}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
    ) : currentDataset ? (
      <DatasetViewer
        headers={currentDataset.headers}
        data={currentDataset.data}
      />
    ) : (
      <CodeEditor
        value={currentFile.content}
        language={currentFile.language}
        onChange={handleCodeChange}
        isMobile={isMobile}
      />
    )
  ) : (
    <CodeEditor
      value={scratchCode}
      language={scratchLanguage}
      onChange={handleCodeChange}
      isMobile={isMobile}
    />
  );

  const consoleComponent = (
    <ConsolePanel
      output={consoleOutput}
      onClear={() => setConsoleOutput([])}
      plainEnglishMode={plainEnglishMode}
      onTogglePlainEnglish={togglePlainEnglishMode}
    />
  );

  const aiAssistantComponent = currentFile ? (
    <AIAssistant
      code={currentFile.content}
      language={currentFile.language}
      onCodeUpdate={handleCodeChange}
      selectedCode={selectedCode}
      isMobile={isMobile}
    />
  ) : (
    <AIAssistant
      code={scratchCode}
      language={scratchLanguage}
      onCodeUpdate={(value) => handleCodeChange(value)}
      selectedCode={selectedCode}
      isMobile={isMobile}
    />
  );

  const dataOpsComponent = (
    <DataOperations 
      onInsertCode={handleInsertCode}
      datasetName={currentFile ? files.find(f => f.id === activeFile)?.name : undefined}
      currentLanguage={
        currentFile?.language === 'r' || currentFile?.language === 'python' 
          ? currentFile.language 
          : scratchLanguage === 'r' || scratchLanguage === 'python'
          ? scratchLanguage
          : 'python'
      }
    />
  );

  const mlOpsComponent = (
    <MLOperations 
      onInsertCode={handleInsertCode}
    />
  );

  return (
    <>
      {showWelcome && <WelcomeOverlay onDismiss={() => setShowWelcome(false)} />}
      
      <div className="flex flex-col h-screen">
        {isMobile ? (
          <MobileLayout
            toolbar={toolbarComponent}
            fileExplorer={fileExplorerComponent}
            editor={editorComponent}
            console={consoleComponent}
            onRun={handleRunCode}
            isRunning={isRunning}
            currentFile={activeFile}
            onDownload={handleDownload}
            onClearConsole={() => setConsoleOutput([])}
            onCSVUpload={handleCSVUpload}
            onCopyAll={handleCopyAll}
            onSaveScratchAsFile={handleSaveScratchAsFile}
            dataOpsComponent={
              <div className="flex gap-1">
                {dataOpsComponent}
                {mlOpsComponent}
              </div>
            }
            featureDrawer={
              <FeatureDrawer
                open={featureDrawerOpen}
                onOpenChange={setFeatureDrawerOpen}
                aiAssistant={aiAssistantComponent}
                packageManager={packageManagerComponent}
                dataLab={dataLabComponent}
                dataOperations={dataOpsComponent}
                mlOperations={mlOpsComponent}
                labTrainer={labTrainerComponent}
              />
            }
          />
        ) : (
          <>
            <DesktopLayout
              toolbar={toolbarComponent}
              fileExplorer={fileExplorerComponent}
              editor={editorComponent}
              console={consoleComponent}
            />
            <SidePanel
              open={sidePanelOpen}
              onOpenChange={setSidePanelOpen}
              aiAssistant={aiAssistantComponent}
              packageManager={packageManagerComponent}
              dataLab={dataLabComponent}
              dataOperations={dataOpsComponent}
              mlOperations={mlOpsComponent}
              labTrainer={labTrainerComponent}
            />
          </>
        )}
      </div>
      
      {plotData && (
        <PlotViewer plotData={plotData} onClose={() => setPlotData(null)} />
      )}

      {showWelcome && (
        <WelcomeOverlay onDismiss={() => setShowWelcome(false)} />
      )}

      <TranslateDialog
        open={translateDialogOpen}
        onOpenChange={setTranslateDialogOpen}
        sourceCode={activeFile ? (currentFile?.content || '') : scratchCode}
        sourceLanguage={activeFile ? (currentFile?.language as any || 'python') : scratchLanguage}
        onTranslated={handleTranslatedCode}
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        code={activeFile ? (currentFile?.content || '') : scratchCode}
        language={activeFile ? (currentFile?.language || 'python') : scratchLanguage}
        fileName={activeFile ? currentFile?.name : undefined}
      />
    </>
  );
};

export default IDE;
