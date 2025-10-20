import { ReactNode, useState, ReactElement, cloneElement, isValidElement } from "react";
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
  const [consoleCollapsed, setConsoleCollapsed] = useState(true);
  
  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <div className="h-10 bg-background/95 backdrop-blur-sm border-b border-primary/20 flex items-center px-3 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="h-8 w-8 hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all"
        >
          <Home className="w-3.5 h-3.5" />
        </Button>
        <div className="flex-1 overflow-x-auto scrollbar-hide">
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
            <ResizablePanel defaultSize={consoleCollapsed ? 97 : 70} minSize={5}>
              <div className="h-full bg-editor overflow-hidden">
                {editor}
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel 
              defaultSize={consoleCollapsed ? 3 : 30} 
              minSize={3} 
              maxSize={95}
              collapsible={true}
              collapsedSize={3}
            >
            <div className="h-full">
              {isValidElement(consolePanel) 
                ? cloneElement(consolePanel as ReactElement, { 
                    isCollapsed: consoleCollapsed, 
                    onToggleCollapse: () => setConsoleCollapsed(!consoleCollapsed) 
                  })
                : consolePanel}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
