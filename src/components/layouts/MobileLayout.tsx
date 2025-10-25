import { ReactNode, useState } from "react";
import { Play, Menu, FileUp, X, Maximize2, Minimize2, MoreVertical, Copy, Save, Download, Home, Trash2, Undo, Redo, Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  hasNewOutput = false,
  consoleOpen = false,
  onConsoleOpenChange,
}: MobileLayoutProps) => {
  const navigate = useNavigate();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [consoleSheetOpen, setConsoleSheetOpen] = useState(false);

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
            {/* Console Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 touch-manipulation active:scale-95 transition-transform relative"
              onClick={() => {
                hapticFeedback();
                setConsoleSheetOpen(true);
              }}
            >
              <Terminal className="w-4 h-4" />
              {hasNewOutput && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary animate-pulse">
                  !
                </Badge>
              )}
            </Button>

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

      {/* Editor - Takes Full Height with Bottom Padding for Floating Button */}
      <div 
        className={isFullScreen ? "h-screen" : "flex-1 min-h-0 overflow-hidden"}
        style={!isFullScreen ? { 
          paddingTop: 'env(safe-area-inset-top)', 
          paddingBottom: 'max(80px, calc(80px + env(safe-area-inset-bottom)))' 
        } : undefined}
      >
        {editor}
      </div>

      {/* Floating Action Button - Run Code */}
      {!isFullScreen && (
        <>
          <div className="fixed right-4 z-40" style={{ bottom: 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))' }}>
            <Button
              onClick={() => {
                hapticFeedback();
                onRun();
              }}
              disabled={isRunning}
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 touch-manipulation active:scale-95 transition-all"
              style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
            >
              <Play className="w-7 h-7" fill="currentColor" />
            </Button>
          </div>

          {/* Console Side Sheet - Slides from Right */}
          <Sheet open={consoleSheetOpen} onOpenChange={setConsoleSheetOpen}>
            <SheetContent 
              side="right" 
              className="w-[90vw] max-w-[400px] bg-background p-0 flex flex-col"
            >
              <SheetHeader className="px-4 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Console
                  </SheetTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearConsole}
                    className="h-8 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                {consolePanel}
              </div>
            </SheetContent>
          </Sheet>

          {/* Tools Drawer - Bottom Left */}
          <div className="fixed left-4 z-40" style={{ bottom: 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))' }}>
            {dataOpsComponent}
          </div>
        </>
      )}
    </div>
  );
};
