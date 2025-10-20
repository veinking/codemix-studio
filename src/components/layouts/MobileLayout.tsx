import { ReactNode, useState } from "react";
import { Play, Menu, FileUp, X, Maximize2, Minimize2, MoreVertical, Copy, Save, Download, Home, Trash2, Undo, Redo } from "lucide-react";
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
  onClearAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSaveScratchAsFile: () => void;
  dataOpsComponent?: ReactNode;
  featureDrawer?: ReactNode;
  hasNewOutput?: boolean;
  consoleOpen?: boolean;
  onConsoleOpenChange?: (open: boolean) => void;
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
  onClearAll,
  onUndo,
  onRedo,
  onSaveScratchAsFile,
  dataOpsComponent,
  featureDrawer,
  hasNewOutput = false,
  consoleOpen = false,
  onConsoleOpenChange,
}: MobileLayoutProps) => {
  const navigate = useNavigate();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const hapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleCSVInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      hapticFeedback();
      onCSVUpload(file);
      setFilesOpen(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden touch-manipulation">
      {/* Minimal Top Bar */}
      {!isFullScreen && (
        <div className="bg-toolbar border-b border-border px-2 py-1.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 touch-manipulation active:scale-95 transition-transform"
              onClick={() => {
                hapticFeedback();
                navigate('/');
              }}
            >
              <Home className="w-4 h-4" />
            </Button>
            <h1 className="text-xs font-bold text-foreground">bIDE</h1>
          </div>
          
          <div className="flex items-center gap-1.5">
            <label htmlFor="csv-upload-mobile" className="cursor-pointer">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 touch-manipulation active:scale-95 transition-transform" 
                asChild
                onClick={hapticFeedback}
              >
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

            <Sheet open={filesOpen} onOpenChange={setFilesOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 touch-manipulation active:scale-95 transition-transform"
                  onClick={hapticFeedback}
                >
                  <Menu className="w-4 h-4" />
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 touch-manipulation active:scale-95 transition-transform"
                  onClick={hapticFeedback}
                >
                  <MoreVertical className="w-4 h-4" />
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
                    className="w-full justify-start h-14 touch-manipulation active:scale-98 transition-transform"
                    onClick={() => {
                      hapticFeedback();
                      onCopyAll();
                      setActionsOpen(false);
                    }}
                  >
                    <Copy className="w-5 h-5 mr-3" />
                    Copy All Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start h-14 touch-manipulation active:scale-98 transition-transform"
                    onClick={() => {
                      hapticFeedback();
                      onClearAll();
                      setActionsOpen(false);
                    }}
                  >
                    <Trash2 className="w-5 h-5 mr-3" />
                    Clear All Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start h-14 touch-manipulation active:scale-98 transition-transform"
                    onClick={() => {
                      hapticFeedback();
                      onUndo();
                      setActionsOpen(false);
                    }}
                  >
                    <Undo className="w-5 h-5 mr-3" />
                    Undo
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start h-14 touch-manipulation active:scale-98 transition-transform"
                    onClick={() => {
                      hapticFeedback();
                      onRedo();
                      setActionsOpen(false);
                    }}
                  >
                    <Redo className="w-5 h-5 mr-3" />
                    Redo
                  </Button>
                  
                  {!currentFile && (
                    <Button
                      variant="outline"
                      className="w-full justify-start h-14 touch-manipulation active:scale-98 transition-transform"
                      onClick={() => {
                        hapticFeedback();
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
                    className="w-full justify-start h-14 touch-manipulation active:scale-98 transition-transform"
                    onClick={() => {
                      hapticFeedback();
                      onDownload();
                      setActionsOpen(false);
                    }}
                  >
                    <Download className="w-5 h-5 mr-3" />
                    Download
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start h-14 touch-manipulation active:scale-98 transition-transform"
                    onClick={() => {
                      hapticFeedback();
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

      {/* Toolbar - Language Selector & Features */}
      {!isFullScreen && (
        <div className="bg-toolbar border-b border-border px-2 py-1.5 shrink-0">
          {toolbar}
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

      {/* Editor - Takes Full Height with Bottom Padding for Floating Buttons */}
      <div 
        className={isFullScreen ? "h-screen" : "flex-1 min-h-0 overflow-hidden"}
        style={!isFullScreen ? { 
          paddingTop: 'env(safe-area-inset-top)', 
          paddingBottom: 'max(120px, calc(120px + env(safe-area-inset-bottom)))' 
        } : undefined}
      >
        {editor}
      </div>

      {/* Floating Run Button + Console Drawer */}
      {!isFullScreen && (
        <>
          {/* Floating Action Button - iOS Safe Area */}
          <div className="fixed right-4 z-40" style={{ bottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))' }}>
            <Button
              onClick={() => {
                hapticFeedback();
                onRun();
              }}
              disabled={isRunning}
              className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 touch-manipulation active:scale-95 transition-transform"
              style={{ boxShadow: 'var(--glow-purple)' }}
            >
              <Play className="w-6 h-6" fill="currentColor" />
            </Button>
          </div>

          {/* Bottom Console Drawer - iOS Safe Area */}
          <Drawer open={consoleOpen} onOpenChange={onConsoleOpenChange}>
            <DrawerTrigger asChild>
              <div 
                className="fixed bottom-0 left-0 right-0 z-30 bg-toolbar border-t transition-all"
                style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
              >
                <button className="w-full py-3 flex items-center justify-center gap-2 active:bg-muted/50 transition-colors touch-manipulation relative">
                  <div className={`w-10 h-1 rounded-full transition-all ${
                    hasNewOutput 
                      ? 'bg-primary animate-pulse' 
                      : 'bg-muted-foreground/40'
                  }`} />
                  {hasNewOutput && (
                    <span className="absolute top-1 right-4 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full animate-pulse font-semibold">
                      New Output
                    </span>
                  )}
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

          {/* Tools Drawer - Positioned higher to avoid blocking editor */}
          <div className="fixed left-4 z-40" style={{ bottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))' }}>
            {dataOpsComponent}
          </div>
        </>
      )}
      
      {/* Feature Drawer */}
      {featureDrawer}
    </div>
  );
};
