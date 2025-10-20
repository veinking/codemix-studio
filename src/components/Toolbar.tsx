import { Play, Download, Code2, Save, Copy, Languages, Share2, FileDown, BarChart3, BookOpen, Settings, Library, Beaker } from "lucide-react";
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
  onOpenRTemplates?: () => void;
  onOpenLabTrainer?: () => void;
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
  onOpenRTemplates,
  onOpenLabTrainer,
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
            {onOpenLabTrainer && (
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenLabTrainer}
                className="h-8 w-8 flex-shrink-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none hover:from-emerald-600 hover:to-teal-600"
                title="Practice Labs"
              >
                <Beaker className="w-4 h-4" />
              </Button>
            )}

            {onShare && (
              <Button
                variant="outline"
                size="icon"
                onClick={onShare}
                className="h-8 w-8 flex-shrink-0"
                title="Share Code"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            
            {onOpenTranslate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenTranslate}
                className="h-8 w-8 flex-shrink-0"
                title="Translate Code"
              >
                <Languages className="w-4 h-4" />
              </Button>
            )}
            
            {onToggleNotebook && !currentFile && (
              <Button
                variant={isNotebookMode ? "default" : "ghost"}
                size="icon"
                onClick={onToggleNotebook}
                className="h-8 w-8 flex-shrink-0"
                title={isNotebookMode ? 'Exit Notebook' : 'Notebook Mode'}
              >
                <BookOpen className="w-4 h-4" />
              </Button>
            )}

            {onOpenFeatures && (
              <Button
                variant="outline"
                size="default"
                onClick={onOpenFeatures}
                className="h-8 px-2.5 flex-shrink-0"
              >
                <Settings className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium">Tools</span>
              </Button>
            )}

            {onOpenTools && (
              <Button
                variant="outline"
                size="default"
                onClick={onOpenTools}
                className="h-8 px-2.5 flex-shrink-0"
              >
                <Settings className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium">Features</span>
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Desktop: Show all buttons with labels */}
            {onOpenLabTrainer && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenLabTrainer}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none hover:from-emerald-600 hover:to-teal-600"
              >
                <Beaker className="w-4 h-4 mr-2" />
                Practice Labs
              </Button>
            )}

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

            {onOpenRTemplates && scratchLanguage === 'r' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenRTemplates}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none hover:from-blue-600 hover:to-cyan-600"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                R Templates
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
                variant="default"
                size="sm"
                onClick={onShare}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
