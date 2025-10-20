import { ReactNode, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Package, Database, BrainCircuit, GraduationCap, MessageSquare, Coffee, X } from "lucide-react";
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
  mlOperations,
  labTrainer,
  feedback,
  about,
}: SidePanelProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('sidepanel-open');
    if (stored !== null) {
      onOpenChange(stored === 'true');
    }
  }, [onOpenChange]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidepanel-open', String(open));
    }
  }, [open, mounted]);

  return (
    <div
      className={cn(
        "h-full border-l border-border bg-background transition-all duration-300 ease-in-out flex-shrink-0",
        open ? "w-80" : "w-0"
      )}
    >
      {open && (
        <div className="h-full flex flex-col w-80">
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <h2 className="text-lg font-semibold">Tools</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="ai" className="flex-1 flex flex-col overflow-hidden min-h-0">
            <TabsList className="w-full justify-start border-b rounded-none bg-background px-2">
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>AI</span>
              </TabsTrigger>
              <TabsTrigger value="packages" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Packages</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Data</span>
              </TabsTrigger>
              <TabsTrigger value="ml" className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4" />
                <span>ML</span>
              </TabsTrigger>
              <TabsTrigger value="learn" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span>Learn</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Feedback</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                <span>About</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="ai" className="mt-0">
                {aiAssistant}
              </TabsContent>
              <TabsContent value="packages" className="mt-0">
                {packageManager}
              </TabsContent>
              <TabsContent value="data" className="mt-0 space-y-4">
                {dataLab}
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold mb-3">Quick Operations</h3>
                  {dataOperations}
                </div>
              </TabsContent>
              <TabsContent value="ml" className="mt-0">
                {mlOperations}
              </TabsContent>
              <TabsContent value="learn" className="mt-0">
                {labTrainer}
              </TabsContent>
              <TabsContent value="feedback" className="mt-0">
                {feedback}
              </TabsContent>
              <TabsContent value="about" className="mt-0">
                {about}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
};
