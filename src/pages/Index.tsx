import { useState, useEffect, useRef } from "react";
import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor";
import { ConsolePanel } from "@/components/ConsolePanel";
import { Toolbar } from "@/components/Toolbar";
import { DatasetViewer } from "@/components/DatasetViewer";
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
  const pyodideRef = useRef<any>(null);

  // Initialize Pyodide
  useEffect(() => {
    const loadPyodide = async () => {
      try {
        // @ts-ignore - Pyodide is loaded via CDN
        const pyodide = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        });
        pyodideRef.current = pyodide;
        addToConsole("Python environment ready!");
      } catch (error) {
        addToConsole("Error loading Python environment: " + error);
      }
    };
    loadPyodide();
  }, []);

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
        addToConsole(`Dataset loaded: ${file.name}`);
      }
      
      newFiles.push(fileItem);
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

  const handleFileDelete = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.language === 'csv') {
      setDatasets(prev => {
        const newMap = new Map(prev);
        newMap.delete(file.name);
        return newMap;
      });
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (activeFile === fileId) {
      setActiveFile(null);
      setShowDataset(null);
    }
    toast.success("File deleted");
  };

  const handleCodeChange = (value: string | undefined) => {
    if (!activeFile || !value) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile ? { ...f, content: value } : f))
    );
  };

  const runPythonCode = async (code: string) => {
    if (!pyodideRef.current) {
      addToConsole("Error: Python environment not ready");
      return;
    }

    setIsRunning(true);
    addToConsole(">>> Running Python code...");
    
    try {
      // Redirect stdout to capture print statements
      await pyodideRef.current.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
      `);
      
      // Run user code
      await pyodideRef.current.runPythonAsync(code);
      
      // Get output
      const output = await pyodideRef.current.runPythonAsync(`
sys.stdout.getvalue()
      `);
      
      if (output) {
        addToConsole(output);
      }
      addToConsole(">>> Execution completed");
    } catch (error: any) {
      addToConsole(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runRCode = (code: string) => {
    addToConsole(">>> R execution not yet implemented");
    addToConsole(">>> Note: R support requires WebR integration");
    toast.info("R support coming soon! Python is ready to use.");
    setIsRunning(false);
  };

  const handleRunCode = async () => {
    if (!activeFile) return;
    
    const file = files.find((f) => f.id === activeFile);
    if (!file) return;
    
    setConsoleOutput([]);
    
    if (file.language === 'python') {
      await runPythonCode(file.content);
    } else if (file.language === 'r') {
      runRCode(file.content);
    } else {
      addToConsole("Error: Can only run Python (.py) or R (.r, .rmd) files");
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

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <Toolbar
        onRun={handleRunCode}
        onDownload={handleDownload}
        currentFile={activeFile}
        isRunning={isRunning}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
            onFileUpload={handleFileUpload}
            onFileDelete={handleFileDelete}
          />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-editor overflow-hidden">
            {currentFile ? (
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
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Welcome to PyR IDE
                  </h2>
                  <p className="text-muted-foreground">
                    Upload a Python (.py), R (.r, .rmd), or CSV file to get started
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="h-64 flex-shrink-0">
            <ConsolePanel
              output={consoleOutput}
              onClear={() => setConsoleOutput([])}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
