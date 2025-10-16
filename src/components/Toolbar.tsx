import { Play, Download, Code2, Save, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataOperations } from "@/components/DataOperations";
import { MLOperations } from "@/components/MLOperations";

interface ToolbarProps {
  onRun: () => void;
  onDownload: () => void;
  onSaveScratchAsFile: () => void;
  onCopyAll: () => void;
  currentFile: string | null;
  isRunning: boolean;
  scratchLanguage: 'python' | 'r' | 'javascript' | 'sql';
  onScratchLanguageChange: (lang: 'python' | 'r' | 'javascript' | 'sql') => void;
  onInsertCode?: (code: string) => void;
  onOpenFeatures?: () => void;
  onOpenTools?: () => void;
}

export const Toolbar = ({ 
  onRun, 
  onDownload, 
  onSaveScratchAsFile,
  onCopyAll,
  currentFile, 
  isRunning,
  scratchLanguage,
  onScratchLanguageChange,
  onInsertCode = () => {},
  onOpenFeatures,
  onOpenTools
}: ToolbarProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {!currentFile && (
          <Select value={scratchLanguage} onValueChange={onScratchLanguageChange}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="r">R</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="sql">SQL</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div className="flex items-center gap-2">{onOpenTools && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTools}
          >
            Tools ⚙️
          </Button>
        )}
        
        {onOpenFeatures && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFeatures}
          >
            Features ✨
          </Button>
        )}
        
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
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopyAll}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy All
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
