import { ReactNode, useState } from "react";
import { Play, ChevronDown, ChevronUp, Maximize2, Minimize2, Menu, Download, Trash2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  onCSVUpload: (file: File) => void;
  dataOpsComponent?: ReactNode;
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
  onCSVUpload,
  dataOpsComponent,
}: MobileLayoutProps) => {
  const [showConsole, setShowConsole] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleCSVInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      onCSVUpload(file);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      {/* Compact Mobile Toolbar */}
      {!isFullScreen && (
        <div className="bg-toolbar border-b border-border px-2 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] bg-background">
                <SheetHeader>
                  <SheetTitle>Files & Tools</SheetTitle>
                  <SheetDescription>Manage your workspace</SheetDescription>
                </SheetHeader>
                <div className="mt-4 h-[calc(100vh-120px)] overflow-auto">
                  {fileExplorer}
                </div>
              </SheetContent>
            </Sheet>
            
            <h1 className="text-xs font-bold text-foreground">PyR IDE</h1>
          </div>

          <div className="flex items-center gap-1">
            {dataOpsComponent}
            
            <label htmlFor="csv-upload-mobile">
              <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                <span>
                  <FileUp className="w-4 h-4" />
                </span>
              </Button>
            </label>
            <input
              id="csv-upload-mobile"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVInput}
            />

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
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
            onClick={onRun}
            disabled={isRunning}
            className="shadow-lg"
          >
            <Play className="w-4 h-4 mr-1" />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
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

      {/* Editor Area - Main Focus */}
      <div className={isFullScreen ? "h-screen" : "flex-1 min-h-0"}>
        {editor}
      </div>

      {/* Bottom Action Bar - Hidden in full screen */}
      {!isFullScreen && (
        <div className="border-t border-border bg-toolbar">
          {/* Run Button */}
          <div className="p-2">
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 touch-manipulation h-12"
              onClick={onRun}
              disabled={isRunning}
            >
              <Play className="w-5 h-5 mr-2" />
              {isRunning ? 'Running...' : 'Run Code'}
            </Button>
          </div>

          {/* Console Toggle */}
          <button
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-secondary transition-colors border-t border-border"
            onClick={() => setShowConsole(!showConsole)}
          >
            <span className="text-xs font-semibold text-foreground">Output</span>
            {showConsole ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Console Area - Collapsible */}
      {showConsole && !isFullScreen && (
        <div className="h-48 border-t border-border">
          {consolePanel}
        </div>
      )}
    </div>
  );
};
