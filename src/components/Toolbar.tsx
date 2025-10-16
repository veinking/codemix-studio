import { Play, Download, Code2, Save, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ToolbarProps {
  onRun: () => void;
  onDownload: () => void;
  onSaveScratchAsFile: () => void;
  currentFile: string | null;
  isRunning: boolean;
  scratchLanguage: 'python' | 'r';
  onScratchLanguageChange: (lang: 'python' | 'r') => void;
}

export const Toolbar = ({ 
  onRun, 
  onDownload, 
  onSaveScratchAsFile,
  currentFile, 
  isRunning,
  scratchLanguage,
  onScratchLanguageChange
}: ToolbarProps) => {
  return (
    <div className="bg-toolbar border-b border-border p-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Code2 className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">OpenIDE</h1>
        
        {!currentFile && (
          <>
            <span className="text-muted-foreground text-sm ml-2">•</span>
            <Select value={scratchLanguage} onValueChange={onScratchLanguageChange}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="r">R</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onRun}
          disabled={isRunning}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Play className="w-4 h-4 mr-2" />
          {isRunning ? 'Running...' : 'Run'}
        </Button>
        
        {!currentFile && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveScratchAsFile}
          >
            <Save className="w-4 h-4 mr-2" />
            Save As
          </Button>
        )}
        
        <Button
          variant="secondary"
          size="sm"
          onClick={onDownload}
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
};
