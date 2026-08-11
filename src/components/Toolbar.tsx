import { Play, Save, Languages, Share2, BarChart3, BookOpen, Settings, Library, User, LogOut, Book, Sparkles, Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AIUsageIndicator } from "@/components/AIUsageIndicator";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  onOpenRecipeGallery?: () => void;
  onOpenWorkspaceManager?: () => void;
  currentLanguage?: string;
  isNotebookMode?: boolean;
  currentFile: string | null;
  isRunning: boolean;
  scratchLanguage: 'python' | 'r' | 'javascript' | 'sql';
  onScratchLanguageChange: (lang: 'python' | 'r' | 'javascript' | 'sql') => void;
  onInsertCode?: (code: string) => void;
  onOpenFeatures?: () => void;
  onOpenTools?: () => void;
  onAuthClick?: () => void;
  initializedRuntimes?: Set<string>;
  loadingRuntimes?: Set<string>;
  isMobile?: boolean;
}

export const Toolbar = ({
  onRun,
  onSaveScratchAsFile,
  onShare,
  onOpenTranslate,
  onOpenPlotBuilder,
  onToggleNotebook,
  onOpenTemplates,
  onOpenRTemplates,
  onOpenRecipeGallery,
  onOpenWorkspaceManager,
  currentLanguage = 'python',
  isNotebookMode = false,
  currentFile,
  isRunning,
  scratchLanguage,
  onScratchLanguageChange,
  onOpenFeatures,
  onOpenTools,
  onAuthClick,
  initializedRuntimes = new Set(),
  loadingRuntimes = new Set(),
  isMobile = false,
}: ToolbarProps) => {
  const navigate = useNavigate();
  const { user, isGuest, signOut } = useAuth();
  const localMode = !isSupabaseConfigured;

  return (
    <div className="flex items-center justify-between w-full gap-1.5">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {localMode ? (
          <Badge variant="outline" className="gap-1.5 text-xs border-primary/30 text-primary">
            <CloudOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Local Mode</span>
          </Badge>
        ) : (
          <AIUsageIndicator />
        )}

        {!currentFile && (
          <LanguageSelector
            currentLanguage={scratchLanguage}
            onLanguageChange={onScratchLanguageChange}
            initializedRuntimes={initializedRuntimes}
            loadingRuntimes={loadingRuntimes}
            isMobile={isMobile}
          />
        )}
      </div>

      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-shrink-0">
        {isMobile ? (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(`/docs/${currentLanguage}`, '_blank')}
              className="h-9 w-9 flex-shrink-0"
              title="Language Reference"
            >
              <Book className="w-4 h-4" />
            </Button>

            {!localMode && onShare && (
              <Button variant="outline" size="icon" onClick={onShare} className="h-9 w-9 flex-shrink-0" title="Share Code">
                <Share2 className="w-4 h-4" />
              </Button>
            )}

            {onOpenFeatures && (
              <Button
                variant="default"
                size="default"
                onClick={onOpenFeatures}
                className="h-9 px-3 flex-shrink-0 bg-gradient-to-r from-primary to-accent relative"
                title="Tools & Features"
              >
                <Settings className="w-4 h-4 mr-1.5" />
                <span className="text-sm font-semibold">Tools</span>
                <Badge className="absolute -top-1 -right-1 h-4 px-1 text-[10px] bg-accent border-0">+</Badge>
              </Button>
            )}

            {!localMode && (
              isGuest ? (
                <Button variant="ghost" size="icon" onClick={onAuthClick} className="h-9 w-9 flex-shrink-0" title="Sign In">
                  <User className="w-4 h-4" />
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                      <Avatar className="h-6 w-6"><AvatarFallback className="bg-primary/20 text-primary text-xs">{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback></Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-[9999]">
                    <DropdownMenuItem onClick={() => navigate('/account')}><User className="w-4 h-4 mr-2" />Account</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}><LogOut className="w-4 h-4 mr-2" />Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </>
        ) : (
          <>
            {onOpenTools && (
              <Button variant="ghost" size="sm" onClick={onOpenTools} className="h-8 px-3 text-xs bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                <Settings className="w-3.5 h-3.5 mr-1.5" />Tools
              </Button>
            )}

            {onOpenTemplates && (
              <Button variant="ghost" size="sm" onClick={onOpenTemplates} className="h-8 px-3 text-xs bg-background border border-primary/30 hover:bg-primary/10">
                <Library className="w-3.5 h-3.5 mr-1.5" />Templates
              </Button>
            )}

            {onOpenRTemplates && scratchLanguage === 'r' && (
              <Button variant="ghost" size="sm" onClick={onOpenRTemplates} className="h-8 px-3 text-xs bg-background border border-primary/30 hover:bg-primary/10">
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />R Templates
              </Button>
            )}

            {onOpenRecipeGallery && (
              <Button variant="ghost" size="sm" onClick={onOpenRecipeGallery} className="h-8 px-3 text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />Recipes
              </Button>
            )}

            {!localMode && onOpenWorkspaceManager && (
              <Button variant="ghost" size="sm" onClick={onOpenWorkspaceManager} className="h-8 px-3 text-xs bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                <Cloud className="w-3.5 h-3.5 mr-1.5" />Cloud
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={() => window.open(`/docs/${currentLanguage}`, '_blank')} className="h-8 px-3 text-xs bg-background border border-primary/30 hover:bg-primary/10">
              <Book className="w-3.5 h-3.5 mr-1.5" />Docs
            </Button>

            {!localMode && onOpenTranslate && (
              <Button variant="ghost" size="sm" onClick={onOpenTranslate} className="h-8 px-3 text-xs bg-background border border-primary/30 hover:bg-primary/10">
                <Languages className="w-3.5 h-3.5 mr-1.5" />Translate
              </Button>
            )}

            {onOpenPlotBuilder && (
              <Button variant="ghost" size="sm" onClick={onOpenPlotBuilder} className="h-8 px-3 text-xs bg-background border border-primary/30 hover:bg-primary/10">
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />Plot
              </Button>
            )}

            {onToggleNotebook && !currentFile && (
              <Button variant={isNotebookMode ? "default" : "ghost"} size="sm" onClick={onToggleNotebook} className="h-8 px-3 text-xs bg-background border border-primary/30 hover:bg-primary/10">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />{isNotebookMode ? 'Exit' : 'Notebook'}
              </Button>
            )}

            <Button variant="default" size="sm" onClick={onRun} disabled={isRunning} className="h-8 px-3 text-xs bg-gradient-to-r from-primary to-accent text-white border-0">
              <Play className="w-3.5 h-3.5 mr-1.5" />{isRunning ? 'Running...' : 'Run'}
            </Button>

            {!localMode && onShare && (
              <Button variant="ghost" size="sm" onClick={onShare} className="h-8 px-3 text-xs bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30">
                <Share2 className="w-3.5 h-3.5 mr-1.5" />Share
              </Button>
            )}

            {!currentFile && (
              <Button variant="ghost" size="sm" onClick={onSaveScratchAsFile} className="h-8 px-3 text-xs bg-background border border-primary/30 hover:bg-primary/10">
                <Save className="w-3.5 h-3.5 mr-1.5" />Save
              </Button>
            )}

            {!localMode && (
              isGuest ? (
                <Button variant="ghost" size="sm" onClick={onAuthClick} className="h-8 px-3 text-xs bg-background border border-primary/30 hover:bg-primary/10">
                  <User className="w-3.5 h-3.5 mr-1.5" />Sign In
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-xs bg-background border border-primary/30 hover:bg-primary/10">
                      <Avatar className="h-5 w-5 mr-1.5"><AvatarFallback className="bg-primary/20 text-primary text-xs">{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback></Avatar>
                      <span className="max-w-[80px] truncate">{user?.email?.split('@')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/account')}><User className="w-4 h-4 mr-2" />Account</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}><LogOut className="w-4 h-4 mr-2" />Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};
