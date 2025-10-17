import { Play, Download, Code2, Save, Copy, Languages, Share2, FileDown, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataOperations } from "@/components/DataOperations";
import { MLOperations } from "@/components/MLOperations";
import { LanguageSelector } from "@/components/LanguageSelector";

interface ToolbarProps {
  onRun: () => void;
  onDownload: () => void;
  onSaveScratchAsFile: () => void;
  onCopyAll: () => void;
  onShare?: () => void;
  onOpenTranslate?: () => void;
  onExportPortfolio?: () => void;
  onOpenPlotBuilder?: () => void;
  currentFile: string | null;
  isRunning: boolean;
  scratchLanguage: 'python' | 'r' | 'javascript' | 'sql';
  onScratchLanguageChange: (lang: 'python' | 'r' | 'javascript' | 'sql') => void;
  onInsertCode?: (code: string) => void;
  onOpenFeatures?: () => void;
  onOpenTools?: () => void;
  initializedRuntimes?: Set<string>;
  isMobile?: boolean;
}

export const Toolbar = ({ 
  onRun, 
  onDownload, 
  onSaveScratchAsFile,
  onCopyAll,
  onShare,
  onOpenTranslate,
  onExportPortfolio,
  onOpenPlotBuilder,
  currentFile, 
  isRunning,
  scratchLanguage,
  onScratchLanguageChange,
  onInsertCode = () => {},
  onOpenFeatures,
  onOpenTools,
  initializedRuntimes = new Set(),
  isMobile = false
}: ToolbarProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {!currentFile && (
          <LanguageSelector
            currentLanguage={scratchLanguage}
            onLanguageChange={onScratchLanguageChange}
            initializedRuntimes={initializedRuntimes}
            isMobile={isMobile}
          />
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {onOpenTranslate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTranslate}
          >
            <Languages className="w-4 h-4 mr-2" />
            Translate
          </Button>
        )}
        
        {onOpenTools && (
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

        {onOpenPlotBuilder && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPlotBuilder}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Plot Builder
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

        {onShare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}

        {onExportPortfolio && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPortfolio}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export Portfolio
          </Button>
        )}
        
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
