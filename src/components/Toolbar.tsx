import { Play, Download, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolbarProps {
  onRun: () => void;
  onDownload: () => void;
  currentFile: string | null;
  isRunning: boolean;
}

export const Toolbar = ({ onRun, onDownload, currentFile, isRunning }: ToolbarProps) => {
  return (
    <div className="bg-toolbar border-b border-border p-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Code2 className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">PyR IDE</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onRun}
          disabled={!currentFile || isRunning}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Play className="w-4 h-4 mr-2" />
          {isRunning ? 'Running...' : 'Run Code'}
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={onDownload}
          disabled={!currentFile}
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
};
