import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface DesktopLayoutProps {
  toolbar: ReactNode;
  fileExplorer: ReactNode;
  editor: ReactNode;
  console: ReactNode;
}

export const DesktopLayout = ({
  toolbar,
  fileExplorer,
  editor,
  console: consolePanel,
}: DesktopLayoutProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <div className="h-12 bg-toolbar border-b border-border flex items-center px-4 gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Button>
        <div className="h-6 w-px bg-border" />
        <div className="flex-1">
          {toolbar}
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-border">
          {fileExplorer}
        </div>
        
        {/* Main Content Area - Resizable Editor & Console */}
        <ResizablePanelGroup direction="vertical" className="flex-1">
          <ResizablePanel defaultSize={65} minSize={30}>
            <div className="h-full bg-editor overflow-hidden">
              {editor}
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={35} minSize={15} maxSize={70}>
            <div className="h-full">
              {consolePanel}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
