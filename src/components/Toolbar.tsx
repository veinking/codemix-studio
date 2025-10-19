import { Play, Download, Code2, Save, Copy, Languages, Share2, FileDown, BarChart3, BookOpen, Settings, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataOperations } from "@/components/DataOperations";
import { MLOperations } from "@/components/MLOperations";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AIUsageIndicator } from "@/components/AIUsageIndicator";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  onRun: () => void;
  onDownload: () => void;
  onSaveScratchAsFile: () => void;
  onCopyAll: () => void;
  onShare?: () => void;
  onOpenTranslate?: () => void;
  onExportPortfolio?: () => void;
  onOpenPlotBuilder?: () => void;
  onToggleNotebook?: () => void;
  onOpenTemplates?: () => void;
  isNotebookMode?: boolean;
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
  onToggleNotebook,
  onOpenTemplates,
  isNotebookMode = false,
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
    <div className="flex items-center justify-between w-full gap-2">
      {/* Left Side - Language Selector */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <AIUsageIndicator />
        
        {!currentFile && (
          <LanguageSelector
            currentLanguage={scratchLanguage}
            onLanguageChange={onScratchLanguageChange}
            initializedRuntimes={initializedRuntimes}
            isMobile={isMobile}
          />
        )}
      </div>
      
      {/* Right Side - Action Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-shrink-0">
        {isMobile ? (
          <>
            {/* Mobile: Show only essential buttons */}
            {onOpenTranslate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenTranslate}
                className="h-9 w-9 flex-shrink-0"
                title="Translate Code"
              >
                <Languages className="w-5 h-5" />
              </Button>
            )}
            
            {onToggleNotebook && !currentFile && (
              <Button
                variant={isNotebookMode ? "default" : "ghost"}
                size="icon"
                onClick={onToggleNotebook}
                className="h-9 w-9 flex-shrink-0"
                title={isNotebookMode ? 'Exit Notebook' : 'Notebook Mode'}
              >
                <BookOpen className="w-5 h-5" />
              </Button>
            )}

            {onOpenFeatures && (
              <Button
                variant="outline"
                size="default"
                onClick={onOpenFeatures}
                className="h-9 px-3 flex-shrink-0"
              >
                <Settings className="w-5 h-5 mr-1.5" />
                <span className="text-sm font-medium">Tools</span>
              </Button>
            )}

            {onOpenTools && (
              <Button
                variant="outline"
                size="default"
                onClick={onOpenTools}
                className="h-9 px-3 flex-shrink-0"
              >
                <Settings className="w-5 h-5 mr-1.5" />
                <span className="text-sm font-medium">Features</span>
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Desktop: Show all buttons with labels */}
            {onOpenTemplates && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenTemplates}
              >
                <Library className="w-4 h-4 mr-2" />
                Templates
              </Button>
            )}

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

            {onToggleNotebook && !currentFile && (
              <Button
                variant={isNotebookMode ? "default" : "outline"}
                size="sm"
                onClick={onToggleNotebook}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {isNotebookMode ? 'Exit' : 'Notebook'}
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
          </>
        )}
      </div>
    </div>
  );
};
