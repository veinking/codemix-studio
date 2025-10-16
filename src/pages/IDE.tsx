import React, { useState, useEffect, useRef } from "react";
import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor";
import { ConsolePanel } from "@/components/ConsolePanel";
import { Toolbar } from "@/components/Toolbar";
import { DatasetViewer } from "@/components/DatasetViewer";
import { PlotViewer } from "@/components/PlotViewer";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { DesktopLayout } from "@/components/layouts/DesktopLayout";
import { AIAssistant } from "@/components/AIAssistant";
import { LabTrainer } from "@/components/LabTrainer";
import { DataOperations } from "@/components/DataOperations";
import { MLOperations } from "@/components/MLOperations";
import { WelcomeOverlay } from "@/components/WelcomeOverlay";
import { useIndexedDB } from "@/hooks/useIndexedDB";
import { useDeviceType } from "@/hooks/useDeviceType";
import { toast } from "sonner";
import { saveAs } from "file-saver";

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content: string;
  language: string;
}

interface Dataset {
  headers: string[];
  data: string[][];
}

const IDE = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [datasets, setDatasets] = useState<Map<string, Dataset>>(new Map());
  const [showDataset, setShowDataset] = useState<string | null>(null);
  const [plotData, setPlotData] = useState<string | null>(null);
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [labTrainerOpen, setLabTrainerOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [runtimesInitialized, setRuntimesInitialized] = useState({
    python: false,
    r: false,
  });
  
  // Scratch pad state (not saved to files, only sessionStorage)
  const [scratchCode, setScratchCode] = useState<string>(() => {
    return sessionStorage.getItem('scratchCode') || '';
  });
  const [scratchLanguage, setScratchLanguage] = useState<'python' | 'r'>(() => {
    return (sessionStorage.getItem('scratchLanguage') as 'python' | 'r') || 'python';
  });
  
  const pyodideRef = useRef<any>(null);
  const webrRef = useRef<any>(null);
  const initializingRef = useRef({ python: false, r: false });
  const { saveFile, loadFiles, deleteFile, isReady: dbReady } = useIndexedDB();
  const { isMobile, deviceType } = useDeviceType();

  // Persist scratch to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('scratchCode', scratchCode);
  }, [scratchCode]);

  useEffect(() => {
    sessionStorage.setItem('scratchLanguage', scratchLanguage);
  }, [scratchLanguage]);

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
          setFiles(storedFiles);
          toast.success(`Loaded ${storedFiles.length} file(s) from storage`);
        }
      } catch (error) {
        console.error("Error loading files:", error);
      }
    };
    
    loadStoredFiles();
  }, [dbReady]);

  const addToConsole = (message: string) => {
    setConsoleOutput((prev) => [...prev, message]);
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'py') return 'python';
    if (ext === 'r' || ext === 'rmd') return 'r';
    if (ext === 'csv') return 'csv';
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
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim())
    );
    
    setDatasets(prev => new Map(prev).set(fileName, { headers, data }));
    
    // Log dataset stats
    addToConsole(`✓ Loaded ${fileName}: ${data.length} rows × ${headers.length} columns`);
  };

  const handleFileSelect = (fileId: string) => {
    setActiveFile(fileId);
    const file = files.find(f => f.id === fileId);
    if (file && file.language === 'csv') {
      setShowDataset(file.name);
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

  const installPythonPackage = async (packageName: string): Promise<void> => {
    if (!pyodideRef.current) {
      toast.error("Python environment not ready");
      return;
    }

    setIsInstalling(true);
    addToConsole(`>>> Installing ${packageName}...`);
    
    try {
      await pyodideRef.current.loadPackage(packageName);
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

  // Lazy initialize Python runtime
  const initializePython = async () => {
    if (pyodideRef.current || initializingRef.current.python) {
      return;
    }
    
    initializingRef.current.python = true;
    const toastId = toast.loading("Initializing Python environment...");
    
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      // @ts-ignore - Pyodide is loaded via CDN
      const pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        fullStdLib: !isIOS,
      });
      pyodideRef.current = pyodide;
      await pyodide.loadPackage("micropip");
      setRuntimesInitialized(prev => ({ ...prev, python: true }));
      addToConsole("✓ Python environment ready!");
      toast.success("Python ready", { id: toastId });
    } catch (error) {
      addToConsole("✗ Error loading Python environment: " + error);
      toast.error("Failed to load Python", { id: toastId });
    } finally {
      initializingRef.current.python = false;
    }
  };

  // Lazy initialize R runtime
  const initializeR = async () => {
    if (webrRef.current || initializingRef.current.r || isMobile) {
      return;
    }
    
    initializingRef.current.r = true;
    const toastId = toast.loading("Initializing R environment...");
    
    try {
      // @ts-ignore - WebR is loaded via CDN
      const { WebR } = await import('https://webr.r-wasm.org/latest/webr.mjs');
      const webR = new WebR();
      await webR.init();
      webrRef.current = webR;
      setRuntimesInitialized(prev => ({ ...prev, r: true }));
      addToConsole("✓ R environment ready!");
      toast.success("R ready", { id: toastId });
    } catch (error) {
      addToConsole("✗ Error loading R environment: " + error);
      toast.error("Failed to load R", { id: toastId });
    } finally {
      initializingRef.current.r = false;
    }
  };

  const runPythonCode = async (code: string) => {
    // Initialize Python if needed
    if (!pyodideRef.current) {
      await initializePython();
      if (!pyodideRef.current) {
        addToConsole("✗ Error: Failed to initialize Python");
        return;
      }
    }

    setIsRunning(true);
    addToConsole(">>> Running Python code...");
    
    try {
      // Setup matplotlib to save plots
      await pyodideRef.current.runPythonAsync(`
import sys
from io import StringIO
import base64

sys.stdout = StringIO()

# Setup matplotlib if available
try:
    import matplotlib
    import matplotlib.pyplot as plt
    matplotlib.use('Agg')
    _plot_data = None
except ImportError:
    pass
      `);
      
      // Run user code
      await pyodideRef.current.runPythonAsync(code);
      
      // Check for plots
      try {
        const plotCheck = await pyodideRef.current.runPythonAsync(`
try:
    import matplotlib.pyplot as plt
    import io
    import base64
    
    if plt.get_fignums():
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode()
        plt.close('all')
        f"data:image/png;base64,{img_str}"
    else:
        ""
except:
    ""
        `);
        
        if (plotCheck) {
          setPlotData(plotCheck);
        }
      } catch (e) {
        // No matplotlib or no plots
      }
      
      // Get output
      const output = await pyodideRef.current.runPythonAsync(`sys.stdout.getvalue()`);
      
      if (output) {
        output.split('\n').forEach((line: string) => addToConsole(line));
      }
      addToConsole(">>> Execution completed ✓");
    } catch (error: any) {
      addToConsole(`✗ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runRCode = async (code: string) => {
    if (isMobile) {
      addToConsole("✗ Error: R is only available on desktop");
      setIsRunning(false);
      return;
    }
    
    // Initialize R if needed
    if (!webrRef.current) {
      await initializeR();
      if (!webrRef.current) {
        addToConsole("✗ Error: Failed to initialize R");
        setIsRunning(false);
        return;
      }
    }

    setIsRunning(true);
    addToConsole(">>> Running R code...");
    
    try {
      const result = await webrRef.current.evalR(code);
      const output = await result.toJs();
      
      if (output) {
        addToConsole(String(output));
      }
      addToConsole(">>> Execution completed ✓");
    } catch (error: any) {
      addToConsole(`✗ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunCode = async () => {
    setConsoleOutput([]);
    setPlotData(null);
    
    // If no active file, run scratch code
    if (!activeFile) {
      if (scratchLanguage === 'python') {
        await runPythonCode(scratchCode);
      } else if (scratchLanguage === 'r') {
        await runRCode(scratchCode);
      }
      return;
    }
    
    // Otherwise run the active file
    const file = files.find((f) => f.id === activeFile);
    if (!file) return;
    
    if (file.language === 'python') {
      await runPythonCode(file.content);
    } else if (file.language === 'r') {
      await runRCode(file.content);
    } else {
      addToConsole("✗ Error: Can only run Python (.py) or R (.r, .rmd) files");
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
    if (activeFile) {
      const file = files.find((f) => f.id === activeFile);
      if (file) {
        const updatedContent = file.content + '\n\n' + code;
        handleCodeChange(updatedContent);
      }
    } else {
      // Insert into scratch pad
      setScratchCode((prev) => prev + '\n\n' + code);
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
      currentFile={activeFile}
      isRunning={isRunning}
      scratchLanguage={scratchLanguage}
      onScratchLanguageChange={setScratchLanguage}
      onInsertCode={handleInsertCode}
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
      onInstallPackage={installPythonPackage}
      isInstalling={isInstalling}
      onOpenLabTrainer={() => setLabTrainerOpen(true)}
    />
  );

  const editorComponent = currentFile ? (
    currentDataset ? (
      <DatasetViewer
        headers={currentDataset.headers}
        data={currentDataset.data}
      />
    ) : (
      <CodeEditor
        value={currentFile.content}
        language={currentFile.language}
        onChange={handleCodeChange}
      />
    )
  ) : (
    <CodeEditor
      value={scratchCode}
      language={scratchLanguage}
      onChange={handleCodeChange}
    />
  );

  const consoleComponent = (
    <ConsolePanel
      output={consoleOutput}
      onClear={() => setConsoleOutput([])}
    />
  );

  const aiAssistantComponent = currentFile ? (
    <AIAssistant
      code={currentFile.content}
      language={currentFile.language}
      onCodeUpdate={handleCodeChange}
      selectedCode={selectedCode}
    />
  ) : (
    <AIAssistant
      code={scratchCode}
      language={scratchLanguage}
      onCodeUpdate={(value) => handleCodeChange(value)}
      selectedCode={selectedCode}
    />
  );

  const dataOpsComponent = (
    <DataOperations 
      onInsertCode={handleInsertCode}
      datasetName={currentFile ? files.find(f => f.id === activeFile)?.name : undefined}
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
          />
        ) : (
          <DesktopLayout
            toolbar={toolbarComponent}
            fileExplorer={fileExplorerComponent}
            editor={editorComponent}
            console={consoleComponent}
          />
        )}
        
        {aiAssistantComponent}
      </div>
      
      {plotData && (
        <PlotViewer plotData={plotData} onClose={() => setPlotData(null)} />
      )}

      <LabTrainer 
        open={labTrainerOpen} 
        onOpenChange={setLabTrainerOpen}
        onLoadLab={handleLoadLabIntoEditor}
      />
    </>
  );
};

export default IDE;
