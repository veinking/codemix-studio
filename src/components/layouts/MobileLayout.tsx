import { ReactNode } from "react";
import { Play, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MobileLayoutProps {
  toolbar: ReactNode;
  fileExplorer: ReactNode;
  editor: ReactNode;
  console: ReactNode;
  onRun: () => void;
  isRunning: boolean;
  currentFile: string | null;
}

export const MobileLayout = ({
  toolbar,
  fileExplorer,
  editor,
  console: consolePanel,
  onRun,
  isRunning,
  currentFile,
}: MobileLayoutProps) => {
  const [showFiles, setShowFiles] = useState(false);
  const [showConsole, setShowConsole] = useState(true);

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      {toolbar}
      
      {/* Mobile File Explorer Toggle */}
      <div className="border-b border-border">
        <button
          className="w-full p-3 flex items-center justify-between bg-toolbar hover:bg-secondary transition-colors"
          onClick={() => setShowFiles(!showFiles)}
        >
          <span className="text-sm font-semibold text-foreground">Files</span>
          {showFiles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showFiles && (
          <div className="h-64 overflow-auto border-b border-border">
            {fileExplorer}
          </div>
        )}
      </div>

      {/* Editor Area */}
      <div className="flex-1 min-h-0">
        {editor}
      </div>

      {/* Mobile Run Button - Fixed at bottom of editor */}
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

      {/* Console Toggle */}
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
    </div>
  );
};
