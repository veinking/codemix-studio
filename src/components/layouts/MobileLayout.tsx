import { ReactNode, useState } from "react";
import { Play, ChevronDown, ChevronUp, Maximize2, Minimize2, Menu, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileLayoutProps {
  toolbar: ReactNode;
  fileExplorer: ReactNode;
  editor: ReactNode;
  console: ReactNode;
  onRun: () => void;
  isRunning: boolean;
  currentFile: string | null;
  onDownload: () => void;
  onClearConsole: () => void;
}

export const MobileLayout = ({
  toolbar,
  fileExplorer,
  editor,
  console: consolePanel,
  onRun,
  isRunning,
  currentFile,
  onDownload,
  onClearConsole,
}: MobileLayoutProps) => {
  const [showFiles, setShowFiles] = useState(false);
  const [showConsole, setShowConsole] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      {/* Mobile Toolbar with Options */}
      {!isFullScreen && (
        <div className="bg-toolbar border-b border-border p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] bg-background">
                <SheetHeader>
                  <SheetTitle>Options</SheetTitle>
                  <SheetDescription>File explorer and settings</SheetDescription>
                </SheetHeader>
                <div className="mt-4 h-[calc(100vh-120px)] overflow-auto">
                  {fileExplorer}
                </div>
              </SheetContent>
            </Sheet>
            
            <h1 className="text-sm font-bold text-foreground">PyR IDE</h1>
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={onDownload} disabled={!currentFile}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClearConsole}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Console
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullScreen(!isFullScreen)}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Full Screen Mode Floating Controls */}
      {isFullScreen && (
        <div className="absolute top-2 right-2 z-50 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsFullScreen(false)}
            className="shadow-lg"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Editor Area */}
      <div className={isFullScreen ? "h-screen" : "flex-1 min-h-0"}>
        {editor}
      </div>

      {/* Mobile Run Button - Hidden in full screen */}
      {!isFullScreen && (
        <div className="p-3 border-y border-border bg-toolbar">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation"
            size="lg"
            onClick={onRun}
            disabled={!currentFile || isRunning}
          >
            <Play className="w-5 h-5 mr-2" />
            {isRunning ? 'Running...' : 'Run Code'}
          </Button>
        </div>
      )}

      {/* Console Toggle - Hidden in full screen */}
      {!isFullScreen && (
        <>
          <div className="border-b border-border">
            <button
              className="w-full p-3 flex items-center justify-between bg-toolbar hover:bg-secondary transition-colors"
              onClick={() => setShowConsole(!showConsole)}
            >
              <span className="text-sm font-semibold text-foreground">Console Output</span>
              {showConsole ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Console Area */}
          {showConsole && (
            <div className="h-48 border-t border-border">
              {consolePanel}
            </div>
          )}
        </>
      )}
    </div>
  );
};
