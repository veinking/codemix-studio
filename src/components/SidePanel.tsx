import { ReactNode, useEffect, useState } from "react";
import { Database, KeyRound, Package, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiAssistant: ReactNode;
  packageManager: ReactNode;
  dataLab: ReactNode;
  dataOperations: ReactNode;
  mlOperations: ReactNode;
  labTrainer: ReactNode;
  feedback: ReactNode;
  about: ReactNode;
}

export const SidePanel = ({
  open,
  onOpenChange,
  aiAssistant,
  packageManager,
  dataLab,
  dataOperations,
}: SidePanelProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sidepanel-open");
    if (stored !== null) onOpenChange(stored === "true");
  }, [onOpenChange]);

  useEffect(() => {
    if (mounted) localStorage.setItem("sidepanel-open", String(open));
  }, [open, mounted]);

  return (
    <aside
      className={cn(
        "h-full flex-shrink-0 border-l border-border bg-background transition-[width] duration-200 ease-out",
        open ? "w-[340px]" : "w-0",
      )}
      aria-hidden={!open}
    >
      {open && (
        <div className="flex h-full w-[340px] flex-col">
          <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border px-4">
            <div>
              <p className="text-sm font-semibold">Workspace tools</p>
              <p className="text-[11px] text-muted-foreground">Useful context, kept out of the editor.</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="data" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="h-11 w-full justify-start gap-1 rounded-none border-b bg-background px-3">
              <TabsTrigger value="data" className="h-8 gap-1.5 px-3 text-xs">
                <Database className="h-3.5 w-3.5" /> Data
              </TabsTrigger>
              <TabsTrigger value="packages" className="h-8 gap-1.5 px-3 text-xs">
                <Package className="h-3.5 w-3.5" /> Packages
              </TabsTrigger>
              <TabsTrigger value="assist" className="h-8 gap-1.5 px-3 text-xs">
                <KeyRound className="h-3.5 w-3.5" /> Assist
              </TabsTrigger>
            </TabsList>

            <div className="tools-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
              <TabsContent value="data" className="mt-0 space-y-5">
                {dataLab}
                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quick operations</p>
                  {dataOperations}
                </div>
              </TabsContent>
              <TabsContent value="packages" className="mt-0">
                {packageManager}
              </TabsContent>
              <TabsContent value="assist" className="mt-0">
                {aiAssistant}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </aside>
  );
};
