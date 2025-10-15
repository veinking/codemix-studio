import { ReactNode } from "react";

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
  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      {toolbar}
      
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <div className="w-64 flex-shrink-0">
          {fileExplorer}
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor */}
          <div className="flex-1 bg-editor overflow-hidden">
            {editor}
          </div>
          
          {/* Console */}
          <div className="h-64 flex-shrink-0">
            {consolePanel}
          </div>
        </div>
      </div>
    </div>
  );
};
