import { ReactNode, useState } from "react";
import { Play, Menu, FileUp, X, Maximize2, Minimize2, MoreVertical, Copy, Save, Download, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
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
  onCopyAll: () => void;
  onSaveScratchAsFile: () => void;
  dataOpsComponent?: ReactNode;
  featureDrawer?: ReactNode;
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
  onCopyAll,
  onSaveScratchAsFile,
  dataOpsComponent,
  featureDrawer,
}: MobileLayoutProps) => {
  const navigate = useNavigate();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const handleCSVInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      onCSVUpload(file);
      setFilesOpen(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden touch-manipulation">
      {/* Minimal Top Bar */}
      {!isFullScreen && (
        <div className="bg-toolbar border-b border-border px-3 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 touch-manipulation"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 w-4" />
            </Button>
            <h1 className="text-sm font-bold text-foreground">OpenIDE</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="csv-upload-mobile" className="cursor-pointer">
              <Button variant="ghost" size="icon" className="h-9 w-9 touch-manipulation" asChild>
                <span>
                  <FileUp className="w-5 h-5" />
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

            <Sheet open={filesOpen} onOpenChange={setFilesOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 touch-manipulation">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-[320px] bg-background p-0">
                <SheetHeader className="px-4 py-3 border-b border-border">
                  <SheetTitle>Files</SheetTitle>
                </SheetHeader>
                <div className="h-[calc(100vh-60px)] overflow-auto">
                  {fileExplorer}
                </div>
              </SheetContent>
            </Sheet>

            <Drawer open={actionsOpen} onOpenChange={setActionsOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 touch-manipulation">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="border-b border-border">
                  <DrawerTitle>Actions</DrawerTitle>
                  <DrawerDescription>Quick file operations</DrawerDescription>
                </DrawerHeader>
                <div className="p-4 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 touch-manipulation"
                    onClick={() => {
                      onCopyAll();
                      setActionsOpen(false);
                    }}
                  >
                    <Copy className="w-5 h-5 mr-3" />
                    Copy All Code
                  </Button>
                  
                  {!currentFile && (
                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 touch-manipulation"
                      onClick={() => {
                        onSaveScratchAsFile();
                        setActionsOpen(false);
                      }}
                    >
                      <Save className="w-5 h-5 mr-3" />
                      Save As File
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 touch-manipulation"
                    onClick={() => {
                      onDownload();
                      setActionsOpen(false);
                    }}
                  >
                    <Download className="w-5 h-5 mr-3" />
                    Download
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 touch-manipulation"
                    onClick={() => {
                      setIsFullScreen(!isFullScreen);
                      setActionsOpen(false);
                    }}
                  >
                    {isFullScreen ? <Minimize2 className="w-5 h-5 mr-3" /> : <Maximize2 className="w-5 h-5 mr-3" />}
                    {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      )}

      {/* Full Screen Exit Button */}
      {isFullScreen && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsFullScreen(false)}
          className="absolute top-3 right-3 z-50 h-10 w-10 rounded-full shadow-lg touch-manipulation"
        >
          <X className="w-5 h-5" />
        </Button>
      )}

      {/* Editor - Takes Full Height */}
      <div className={isFullScreen ? "h-screen" : "flex-1 min-h-0 overflow-hidden"}>
        {editor}
      </div>

      {/* Floating Run Button + Console Drawer */}
      {!isFullScreen && (
        <>
          {/* Floating Action Button - iOS Safe Area */}
          <div className="fixed right-4 z-40" style={{ bottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))' }}>
            <Button
              onClick={onRun}
              disabled={isRunning}
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 touch-manipulation"
              style={{ boxShadow: 'var(--glow-purple)' }}
            >
              <Play className="w-6 h-6" fill="currentColor" />
            </Button>
          </div>

          {/* Bottom Console Drawer - iOS Safe Area */}
          <Drawer>
            <DrawerTrigger asChild>
              <div 
                className="fixed bottom-0 left-0 right-0 z-30 bg-toolbar border-t border-border"
                style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
              >
                <button className="w-full py-3 flex items-center justify-center gap-2 active:bg-muted/50 transition-colors touch-manipulation">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/40" />
                </button>
              </div>
            </DrawerTrigger>
            <DrawerContent 
              className="max-h-[70vh]"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              <DrawerHeader className="border-b border-border">
                <DrawerTitle>Console Output</DrawerTitle>
                <DrawerDescription>View execution results</DrawerDescription>
              </DrawerHeader>
              <div className="h-[50vh] overflow-hidden">
                {consolePanel}
              </div>
            </DrawerContent>
          </Drawer>

          {/* Tools Drawer */}
          <div className="fixed bottom-24 left-4 z-40">
            {dataOpsComponent}
          </div>
        </>
      )}
      
      {/* Feature Drawer */}
      {featureDrawer}
    </div>
  );
};
