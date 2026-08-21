import { ReactNode, useState, ReactElement, cloneElement, isValidElement } from "react";
import { Code2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface DesktopLayoutProps {
  toolbar: ReactNode;
  fileExplorer: ReactNode;
  editor: ReactNode;
  console: ReactNode;
}

export const DesktopLayout = ({ toolbar, fileExplorer, editor, console: consolePanel }: DesktopLayoutProps) => {
  const navigate = useNavigate();
  const [consoleCollapsed, setConsoleCollapsed] = useState(true);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-toolbar px-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mr-3 flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-muted"
          title="bIDE home"
        >
          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/15 text-primary">
            <Code2 className="h-3.5 w-3.5" />
          </span>
          <span className="leading-none">
            <strong className="block text-xs font-semibold tracking-tight">bIDE</strong>
            <span className="mt-0.5 block text-[9px] uppercase tracking-[0.12em] text-muted-foreground">workspace</span>
          </span>
        </button>
        <div className="h-6 w-px shrink-0 bg-border" />
        <div className="min-w-0 flex-1 pl-3">{toolbar}</div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="w-60 shrink-0 border-r border-border bg-sidebar">{fileExplorer}</aside>

        <ResizablePanelGroup direction="vertical" className="min-w-0 flex-1">
          <ResizablePanel defaultSize={consoleCollapsed ? 96 : 70} minSize={8}>
            <div className="h-full overflow-hidden bg-editor">{editor}</div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border/70" />

          <ResizablePanel
            defaultSize={consoleCollapsed ? 4 : 30}
            minSize={4}
            maxSize={92}
            collapsible
            collapsedSize={4}
          >
            <div className="h-full bg-console">
              {isValidElement(consolePanel)
                ? cloneElement(consolePanel as ReactElement, {
                    isCollapsed: consoleCollapsed,
                    onToggleCollapse: () => setConsoleCollapsed(!consoleCollapsed),
                  })
                : consolePanel}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
