import { Play, Download, Code2, Save, Copy, Languages, Share2, FileDown, BarChart3, BookOpen, Settings, Library, Beaker, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataOperations } from "@/components/DataOperations";
import { MLOperations } from "@/components/MLOperations";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AIUsageIndicator } from "@/components/AIUsageIndicator";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ToolbarProps {
  onRun: () => void;
  onDownload: () => void;
  onSaveScratchAsFile: () => void;
  onCopyAll: () => void;
  onClearAll: () => void;
  onShare?: () => void;
  onOpenTranslate?: () => void;
  onExportPortfolio?: () => void;
  onOpenPlotBuilder?: () => void;
  onToggleNotebook?: () => void;
  onOpenTemplates?: () => void;
  onOpenRTemplates?: () => void;
  onOpenLabTrainer?: () => void;
  currentLanguage?: string;
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
  onClearAll,
  onShare,
  onOpenTranslate,
  onExportPortfolio,
  onOpenPlotBuilder,
  onToggleNotebook,
  onOpenTemplates,
  onOpenRTemplates,
  onOpenLabTrainer,
  currentLanguage = 'python',
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
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between w-full gap-1.5">
      {/* Left Side - Language Selector */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
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
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-shrink-0">
        {isMobile ? (
          <>
            {/* Mobile: Show only essential buttons */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(`/docs/${currentLanguage}`, '_blank')}
              className="h-8 w-8 flex-shrink-0"
              title="Language Reference"
            >
              <BookOpen className="w-4 h-4" />
            </Button>

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
            {/* Account (mobile) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/account')}
              className="h-8 w-8 flex-shrink-0"
              title="Account"
            >
              <User className="w-4 h-4" />
            </Button>
          </>
) : (<>
            {/* Desktop: Compact buttons with consistent styling */}
            {onOpenTools && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenTools}
                className="h-8 px-3 text-xs bg-gradient-to-r from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 border border-primary/30 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                Tools
              </Button>
            )}

            {onOpenTemplates && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenTemplates}
                className="h-8 px-3 text-xs bg-background border border-primary/30 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all"
              >
                <Library className="w-3.5 h-3.5 mr-1.5" />
                Templates
              </Button>
            )}

            {onOpenRTemplates && scratchLanguage === 'r' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenRTemplates}
                className="h-8 px-3 text-xs bg-background border border-primary/30 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                R Templates
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/docs/${currentLanguage}`, '_blank')}
              className="h-8 px-3 text-xs bg-background border border-primary/30 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Docs
            </Button>

            {onOpenTranslate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenTranslate}
                className="h-8 px-3 text-xs bg-background border border-primary/30 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all"
              >
                <Languages className="w-3.5 h-3.5 mr-1.5" />
                Translate
              </Button>
            )}

            {onOpenPlotBuilder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenPlotBuilder}
                className="h-8 px-3 text-xs bg-background border border-primary/30 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                Plot
              </Button>
            )}

            {onToggleNotebook && !currentFile && (
              <Button
                variant={isNotebookMode ? "default" : "ghost"}
                size="sm"
                onClick={onToggleNotebook}
                className={`h-8 px-3 text-xs transition-all ${
                  isNotebookMode
                    ? ""
                    : "bg-background border border-primary/30 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                {isNotebookMode ? 'Exit' : 'Notebook'}
              </Button>
            )}
            
            <Button
              variant="default"
              size="sm"
              onClick={onRun}
              disabled={isRunning}
              className="h-8 px-3 text-xs bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 hover:shadow-[0_0_12px_rgba(168,85,247,0.6)] transition-all"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>

            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onShare}
                className="h-8 px-3 text-xs bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 border border-primary/30 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Share
              </Button>
            )}
            
            {!currentFile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSaveScratchAsFile}
                className="h-8 px-3 text-xs bg-background border border-primary/30 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save
              </Button>
            )}

            {/* Account (desktop) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/account')}
              className="h-8 px-3 text-xs bg-background border border-primary/30 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all"
            >
              <User className="w-3.5 h-3.5 mr-1.5" />
              Account
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
