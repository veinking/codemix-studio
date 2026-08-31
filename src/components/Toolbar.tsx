import {
  Book,
  Cloud,
  Library,
  LogOut,
  MoreHorizontal,
  Play,
  Save,
  Settings2,
  Share2,
  User,
  BarChart3,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  scratchLanguage: "python" | "r" | "javascript" | "sql";
  onScratchLanguageChange: (lang: "python" | "r" | "javascript" | "sql") => void;
  onInsertCode?: (code: string) => void;
  onOpenFeatures?: () => void;
  onOpenTools?: () => void;
  onAuthClick?: () => void;
  initializedRuntimes?: Set<string>;
  loadingRuntimes?: Set<string>;
  isMobile?: boolean;
  showScratchLanguageSelector?: boolean;
}

export const Toolbar = ({
  onRun,
  onSaveScratchAsFile,
  onShare,
  onOpenPlotBuilder,
  onToggleNotebook,
  onOpenTemplates,
  onOpenWorkspaceManager,
  currentLanguage = "python",
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
  showScratchLanguageSelector = false,
}: ToolbarProps) => {
  const navigate = useNavigate();
  const { user, isGuest, signOut } = useAuth();

  const openPocketBIAccount = () => window.open("https://pocketbi.app/account", "PocketBIAccount");

  const shouldShowLanguageSelector = !currentFile || showScratchLanguageSelector;

  const accountControl = isGuest ? (
    <Button
      variant="ghost"
      size={isMobile ? "icon" : "sm"}
      onClick={onAuthClick}
      className={isMobile ? "h-9 w-9" : "h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"}
      title="Connect PocketBI ID to bIDE"
    >
      <User className="h-4 w-4" />
      {!isMobile && <span className="ml-1.5">Connect PocketBI ID</span>}
    </Button>
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={isMobile ? "icon" : "sm"} className={isMobile ? "h-9 w-9" : "h-8 px-2"} title="PocketBI ID in bIDE">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary/15 text-primary text-xs">{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          {!isMobile && <span className="ml-2 max-w-[90px] truncate text-xs">{user?.email?.split("@")[0]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => navigate("/account")}><User className="mr-2 h-4 w-4" /> bIDE sign-in & access</DropdownMenuItem>
        <DropdownMenuItem onClick={openPocketBIAccount}><ExternalLink className="mr-2 h-4 w-4" /> PocketBI Account Home</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Sign out of bIDE</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isMobile) {
    return (
      <div className="flex w-full items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {shouldShowLanguageSelector && (
            <LanguageSelector
              currentLanguage={scratchLanguage}
              onLanguageChange={onScratchLanguageChange}
              initializedRuntimes={initializedRuntimes}
              loadingRuntimes={loadingRuntimes}
              isMobile
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => window.open(`/docs/${currentLanguage}`, "_blank")} className="h-9 w-9" title="Language reference">
            <Book className="h-4 w-4" />
          </Button>
          {onOpenFeatures && (
            <Button variant="ghost" size="icon" onClick={onOpenFeatures} className="h-9 w-9" title="Workspace tools"><Settings2 className="h-4 w-4" /></Button>
          )}
          {accountControl}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {shouldShowLanguageSelector && (
          <LanguageSelector
            currentLanguage={scratchLanguage}
            onLanguageChange={onScratchLanguageChange}
            initializedRuntimes={initializedRuntimes}
            loadingRuntimes={loadingRuntimes}
            isMobile={false}
          />
        )}
        {currentFile && <span className="truncate text-xs text-muted-foreground">File workspace</span>}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="default" size="sm" onClick={onRun} disabled={isRunning} className="h-8 px-3 text-xs shadow-none">
          <Play className="mr-1.5 h-3.5 w-3.5" />{isRunning ? "Running…" : "Run"}
        </Button>

        {!currentFile && (
          <Button variant="ghost" size="sm" onClick={onSaveScratchAsFile} className="h-8 px-2.5 text-xs"><Save className="mr-1.5 h-3.5 w-3.5" /> Save</Button>
        )}

        {onShare && (
          <Button variant="ghost" size="sm" onClick={onShare} className="h-8 px-2.5 text-xs"><Share2 className="mr-1.5 h-3.5 w-3.5" /> Share</Button>
        )}

        <Button variant="ghost" size="sm" onClick={() => window.open(`/docs/${currentLanguage}`, "_blank")} className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground">
          <Book className="mr-1.5 h-3.5 w-3.5" /> Docs
        </Button>

        {onOpenTools && (
          <Button variant="ghost" size="sm" onClick={onOpenTools} className="h-8 px-2.5 text-xs"><Settings2 className="mr-1.5 h-3.5 w-3.5" /> Tools</Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="More editor actions"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {onToggleNotebook && !currentFile && (
              <DropdownMenuItem onClick={onToggleNotebook}><BookOpen className="mr-2 h-4 w-4" /> {isNotebookMode ? "Exit notebook" : "Notebook mode"}</DropdownMenuItem>
            )}
            {onOpenPlotBuilder && (
              <DropdownMenuItem onClick={onOpenPlotBuilder}><BarChart3 className="mr-2 h-4 w-4" /> Plot builder</DropdownMenuItem>
            )}
            {onOpenTemplates && (
              <DropdownMenuItem onClick={onOpenTemplates}><Library className="mr-2 h-4 w-4" /> Templates</DropdownMenuItem>
            )}
            {onOpenWorkspaceManager && (
              <DropdownMenuItem onClick={onOpenWorkspaceManager}><Cloud className="mr-2 h-4 w-4" /> Cloud workspace</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {accountControl}
      </div>
    </div>
  );
};