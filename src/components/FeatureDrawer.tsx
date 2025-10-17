import { ReactNode } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Package, Database, BrainCircuit, GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeatureDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiAssistant: ReactNode;
  packageManager: ReactNode;
  dataLab: ReactNode;
  dataOperations: ReactNode;
  mlOperations: ReactNode;
  labTrainer: ReactNode;
}

export const FeatureDrawer = ({
  open,
  onOpenChange,
  aiAssistant,
  packageManager,
  dataLab,
  dataOperations,
  mlOperations,
  labTrainer,
}: FeatureDrawerProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] pb-safe">
        <DrawerHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>Tools & Features</DrawerTitle>
              <DrawerDescription>
                AI assistance, packages, data operations, and learning tools
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <Tabs defaultValue="ai" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start border-b rounded-none bg-background px-4">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Packages</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="ml" className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" />
              <span className="hidden sm:inline">ML</span>
            </TabsTrigger>
            <TabsTrigger value="learn" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Learn</span>
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
          </div>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};
