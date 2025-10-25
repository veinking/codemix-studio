import React, { useState, useCallback } from 'react';
import { NotebookCell, NotebookCellData } from './NotebookCell';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Play, Plus, Download, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils';

interface NotebookModeProps {
  language: 'python' | 'r' | 'javascript' | 'sql';
  onExecuteCell: (code: string) => Promise<{ output: string; error?: string }>;
  isRunning: boolean;
  isMobile?: boolean;
}

export const NotebookMode: React.FC<NotebookModeProps> = ({
  language,
  onExecuteCell,
  isRunning,
  isMobile = false
}) => {
  const [cells, setCells] = useState<NotebookCellData[]>([
    {
      id: crypto.randomUUID(),
      type: 'markdown',
      content: '# My Notebook\n\nWelcome! This is a notebook where you can mix code and documentation.'
    },
    {
      id: crypto.randomUUID(),
      type: 'code',
      content: language === 'python' 
        ? '# Write your Python code here\nprint("Hello from notebook!")'
        : language === 'r'
        ? '# Write your R code here\nprint("Hello from notebook!")'
        : language === 'javascript'
        ? '// Write your JavaScript code here\nconsole.log("Hello from notebook!");'
        : '-- Write your SQL code here\nSELECT "Hello from notebook!" AS message;'
    }
  ]);
  const [runningCellId, setRunningCellId] = useState<string | null>(null);

  const handleRunCell = useCallback(async (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell || cell.type !== 'code') return;

    setRunningCellId(cellId);
    
    try {
      const result = await onExecuteCell(cell.content);
      setCells(prev => prev.map(c => 
        c.id === cellId 
          ? { ...c, output: result.output, isError: !!result.error }
          : c
      ));
    } catch (error) {
      setCells(prev => prev.map(c => 
        c.id === cellId 
          ? { ...c, output: error instanceof Error ? error.message : 'Execution failed', isError: true }
          : c
      ));
    } finally {
      setRunningCellId(null);
    }
  }, [cells, onExecuteCell]);

  const handleRunAll = useCallback(async () => {
    const codeCells = cells.filter(c => c.type === 'code');
    
    for (const cell of codeCells) {
      await handleRunCell(cell.id);
    }
    
    toast.success(`Ran ${codeCells.length} code cells`);
  }, [cells, handleRunCell]);

  const handleAddCell = useCallback((afterId: string | null, type: 'code' | 'markdown') => {
    const newCell: NotebookCellData = {
      id: crypto.randomUUID(),
      type,
      content: type === 'code' 
        ? (language === 'python' ? '# New code cell\n' 
           : language === 'r' ? '# New code cell\n'
           : language === 'javascript' ? '// New code cell\n'
           : '-- New code cell\n')
        : '## New Section\n\nWrite your documentation here...'
    };

    setCells(prev => {
      if (afterId === null) {
        return [...prev, newCell];
      }
      const index = prev.findIndex(c => c.id === afterId);
      return [
        ...prev.slice(0, index + 1),
        newCell,
        ...prev.slice(index + 1)
      ];
    });
  }, [language]);

  const handleDeleteCell = useCallback((cellId: string) => {
    setCells(prev => prev.filter(c => c.id !== cellId));
    toast.success('Cell deleted');
  }, []);

  const handleContentChange = useCallback((cellId: string, content: string) => {
    setCells(prev => prev.map(c => 
      c.id === cellId ? { ...c, content } : c
    ));
  }, []);

  const handleMoveUp = useCallback((cellId: string) => {
    setCells(prev => {
      const index = prev.findIndex(c => c.id === cellId);
      if (index <= 0) return prev;
      
      const newCells = [...prev];
      [newCells[index - 1], newCells[index]] = [newCells[index], newCells[index - 1]];
      return newCells;
    });
  }, []);

  const handleMoveDown = useCallback((cellId: string) => {
    setCells(prev => {
      const index = prev.findIndex(c => c.id === cellId);
      if (index === -1 || index >= prev.length - 1) return prev;
      
      const newCells = [...prev];
      [newCells[index], newCells[index + 1]] = [newCells[index + 1], newCells[index]];
      return newCells;
    });
  }, []);

  const handleDuplicateCell = useCallback((cellId: string) => {
    setCells(prev => {
      const index = prev.findIndex(c => c.id === cellId);
      if (index === -1) return prev;
      
      const cellToDuplicate = prev[index];
      const newCell: NotebookCellData = {
        ...cellToDuplicate,
        id: crypto.randomUUID(),
        output: undefined,
        isError: undefined
      };
      
      return [
        ...prev.slice(0, index + 1),
        newCell,
        ...prev.slice(index + 1)
      ];
    });
    toast.success('Cell duplicated');
  }, []);

  const handleExportNotebook = useCallback(() => {
    const notebook = {
      metadata: {
        kernelspec: {
          display_name: language === 'python' ? 'Python 3' : language === 'r' ? 'R' : language,
          language: language,
          name: language
        }
      },
      nbformat: 4,
      nbformat_minor: 5,
      cells: cells.map(cell => ({
        cell_type: cell.type === 'code' ? 'code' : 'markdown',
        metadata: {},
        source: cell.content.split('\n'),
        ...(cell.type === 'code' && {
          execution_count: null,
          outputs: cell.output ? [{
            output_type: cell.isError ? 'error' : 'stream',
            name: cell.isError ? 'stderr' : 'stdout',
            text: cell.output.split('\n')
          }] : []
        })
      }))
    };

    const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' });
    const ext = language === 'python' ? 'ipynb' : language === 'r' ? 'Rmd' : 'ipynb';
    saveAs(blob, `notebook.${ext}`);
    toast.success('Notebook exported successfully');
  }, [cells, language]);

  const handleImportNotebook = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'ipynb') {
          // Import Jupyter notebook format
          const notebook = JSON.parse(content);
          
          if (notebook.cells && Array.isArray(notebook.cells)) {
            const importedCells: NotebookCellData[] = notebook.cells.map((cell: any) => ({
              id: crypto.randomUUID(),
              type: cell.cell_type === 'markdown' ? 'markdown' : 'code',
              content: Array.isArray(cell.source) ? cell.source.join('') : cell.source,
              output: cell.outputs?.[0]?.text ? 
                (Array.isArray(cell.outputs[0].text) ? cell.outputs[0].text.join('\n') : cell.outputs[0].text)
                : undefined,
              isError: cell.outputs?.[0]?.output_type === 'error'
            }));
            
            setCells(importedCells);
            toast.success('Jupyter notebook imported successfully');
          }
        } else if (fileExtension === 'py' || fileExtension === 'r') {
          // Import plain Python/R file as single code cell
          const importedCells: NotebookCellData[] = [
            {
              id: crypto.randomUUID(),
              type: 'code',
              content: content,
              output: undefined,
              isError: undefined
            }
          ];
          
          setCells(importedCells);
          toast.success(`${fileExtension.toUpperCase()} file imported as notebook`);
        } else {
          toast.error('Unsupported file format. Use .ipynb, .py, or .r files');
        }
      } catch (error) {
        console.error('Error importing file:', error);
        toast.error('Failed to import file');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar - Mobile Optimized */}
      <div className={cn(
        "flex items-center justify-between border-b border-border bg-card",
        isMobile ? "px-2 py-2" : "px-4 py-2"
      )}>
        <h2 className={cn("font-semibold", isMobile ? "text-sm" : "text-lg")}>Notebook</h2>
        <div className={cn("flex items-center", isMobile ? "gap-0.5" : "gap-1")}>
          <input
            type="file"
            accept=".ipynb,.py,.r"
            onChange={handleImportNotebook}
            className="hidden"
            id="notebook-import"
          />
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            onClick={() => document.getElementById('notebook-import')?.click()}
            className={cn(isMobile && "h-9 w-9 p-0")}
          >
            <FileUp className={cn(isMobile ? "w-4 h-4" : "w-4 h-4 mr-2")} />
            {!isMobile && "Import"}
          </Button>
          
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            onClick={handleExportNotebook}
            className={cn(isMobile && "h-9 w-9 p-0")}
          >
            <Download className={cn(isMobile ? "w-4 h-4" : "w-4 h-4 mr-2")} />
            {!isMobile && "Export"}
          </Button>
          
          <Button
            variant="default"
            size={isMobile ? "default" : "sm"}
            onClick={handleRunAll}
            disabled={isRunning}
            className={cn(isMobile && "h-9 px-3")}
          >
            <Play className="w-4 h-4" />
            {!isMobile && <span className="ml-2">Run All</span>}
          </Button>
        </div>
      </div>

      {/* Cells - Mobile Optimized Scrolling */}
      <ScrollArea 
        className={cn("flex-1", isMobile ? "px-2 py-2" : "px-4 py-4")}
        style={{ overscrollBehaviorX: 'contain' }}
      >
        {cells.length === 0 ? (
          <div className={cn("text-center text-muted-foreground", isMobile ? "py-8" : "py-12")}>
            <p className={cn("mb-4", isMobile ? "text-sm" : "text-sm")}>No cells yet. Add your first cell below!</p>
            <div className={cn("flex items-center justify-center", isMobile ? "flex-col gap-2" : "gap-2")}>
              <Button
                variant="outline"
                onClick={() => handleAddCell(null, 'code')}
                className={cn(isMobile && "w-full max-w-xs h-10")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Code Cell
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddCell(null, 'markdown')}
                className={cn(isMobile && "w-full max-w-xs h-10")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Markdown Cell
              </Button>
            </div>
          </div>
        ) : (
          <>
            {cells.map((cell, index) => (
              <NotebookCell
                key={cell.id}
                cell={cell}
                language={language}
                isRunning={runningCellId === cell.id}
                onRun={handleRunCell}
                onDelete={handleDeleteCell}
                onContentChange={handleContentChange}
                onAddBelow={(cellId, type) => handleAddCell(cellId, type)}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onDuplicate={handleDuplicateCell}
                canMoveUp={index > 0}
                canMoveDown={index < cells.length - 1}
                isMobile={isMobile}
              />
            ))}
            
            {/* Add cell at end - Mobile Optimized */}
            <div className={cn(
              "flex items-center justify-center border-t border-border/30 pt-3 mt-2",
              isMobile ? "flex-col gap-2" : "gap-2"
            )}>
              <Button
                variant="outline"
                onClick={() => handleAddCell(null, 'code')}
                className={cn(isMobile && "w-full h-10")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Code Cell
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddCell(null, 'markdown')}
                className={cn(isMobile && "w-full h-10")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Markdown Cell
              </Button>
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  );
};
