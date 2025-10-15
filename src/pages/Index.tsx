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

const Index = () => {
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
  
  const pyodideRef = useRef<any>(null);
  const webrRef = useRef<any>(null);
  const { saveFile, loadFiles, deleteFile, isReady: dbReady } = useIndexedDB();
  const { isMobile, deviceType } = useDeviceType();

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

  // Initialize Pyodide
  useEffect(() => {
    const loadPyodide = async () => {
      try {
        // @ts-ignore - Pyodide is loaded via CDN
        const pyodide = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        });
        pyodideRef.current = pyodide;
        addToConsole("✓ Python environment ready!");
      } catch (error) {
        addToConsole("✗ Error loading Python environment: " + error);
      }
    };
    loadPyodide();
  }, []);

  // Initialize WebR
  useEffect(() => {
    const loadWebR = async () => {
      try {
        // @ts-ignore - WebR is loaded via CDN
        const { WebR } = await import('https://webr.r-wasm.org/latest/webr.mjs');
        const webR = new WebR();
        await webR.init();
        webrRef.current = webR;
        addToConsole("✓ R environment ready!");
      } catch (error) {
        addToConsole("✗ Error loading R environment: " + error);
      }
    };
    
    // Only load WebR on desktop to save mobile resources
    if (!isMobile) {
      loadWebR();
    }
  }, [isMobile]);

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
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
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
      
      // Save to IndexedDB
      if (dbReady) {
        await saveFile(fileItem);
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
    if (!activeFile || !value) return;
    
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === activeFile) {
          const updated = { ...f, content: value };
          // Auto-save to IndexedDB
          if (dbReady) {
            saveFile(updated);
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

  const runPythonCode = async (code: string) => {
    if (!pyodideRef.current) {
      addToConsole("✗ Error: Python environment not ready");
      return;
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
    if (!webrRef.current) {
      addToConsole("✗ Error: R environment not ready (Desktop only)");
      setIsRunning(false);
      return;
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
    if (!activeFile) return;
    
    const file = files.find((f) => f.id === activeFile);
    if (!file) return;
    
    setConsoleOutput([]);
    setPlotData(null);
    
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
    if (!activeFile) return;
    const file = files.find((f) => f.id === activeFile);
    if (!file) return;
    
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, file.name);
    toast.success(`Downloaded ${file.name}`);
  };

  const currentFile = files.find((f) => f.id === activeFile);
  const currentDataset = showDataset ? datasets.get(showDataset) : null;

  // Prepare components
  const toolbarComponent = (
    <Toolbar
      onRun={handleRunCode}
      onDownload={handleDownload}
      currentFile={activeFile}
      isRunning={isRunning}
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
    <div className="h-full flex items-center justify-center">
      <div className="text-center p-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Welcome to OpenIDE
        </h2>
        <p className="text-muted-foreground mb-2">
          {isMobile ? 'Tap' : 'Click'} "New File" or upload a Python (.py), R (.r, .rmd), or CSV file
        </p>
        <p className="text-xs text-muted-foreground">
          Files are automatically saved to your browser • Device: {deviceType}
        </p>
      </div>
    </div>
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
  ) : null;

  return (
    <>
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
    </>
  );
};

export default Index;
