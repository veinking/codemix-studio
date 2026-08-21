import { ReactNode } from "react";
import { BarChart3, BookOpen, Cloud, Database, KeyRound, Library, Package, Wrench, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiAssistant: ReactNode;
  packageManager: ReactNode;
  dataLab: ReactNode;
  dataOperations: ReactNode;
  mlOperations: ReactNode;
  labTrainer: ReactNode;
  about: ReactNode;
  recipeGallery?: ReactNode;
  workspaceManager?: ReactNode;
  onToggleNotebook?: () => void;
  isNotebookMode?: boolean;
  onOpenTranslate?: () => void;
  onOpenPlotBuilder?: () => void;
  onOpenTemplates?: () => void;
  onOpenRTemplates?: () => void;
  onExportPortfolio?: () => void;
  currentLanguage?: string;
}

export const FeatureDrawer = ({
  open,
  onOpenChange,
  aiAssistant,
  packageManager,
  dataLab,
  dataOperations,
  workspaceManager,
  onToggleNotebook,
  isNotebookMode,
  onOpenPlotBuilder,
  onOpenTemplates,
}: FeatureDrawerProps) => {
  const closeThen = (action?: () => void) => () => {
    action?.();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[76vh] pb-safe">
        <DrawerHeader className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <DrawerTitle>Workspace tools</DrawerTitle>
              <DrawerDescription>Secondary tools stay here so the editor stays focused.</DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <Tabs defaultValue="data" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="h-12 w-full justify-start gap-1 rounded-none border-b bg-background px-3">
            <TabsTrigger value="data" className="gap-1.5 text-xs">
              <Database className="h-4 w-4" /> Data
            </TabsTrigger>
            <TabsTrigger value="packages" className="gap-1.5 text-xs">
              <Package className="h-4 w-4" /> Packages
            </TabsTrigger>
            <TabsTrigger value="assist" className="gap-1.5 text-xs">
              <KeyRound className="h-4 w-4" /> Assist
            </TabsTrigger>
            <TabsTrigger value="more" className="gap-1.5 text-xs">
              <Wrench className="h-4 w-4" /> More
            </TabsTrigger>
          </TabsList>

          <div className="tools-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
            <TabsContent value="data" className="mt-0 space-y-5">
              {dataLab}
              <div className="border-t border-border pt-4">{dataOperations}</div>
            </TabsContent>

            <TabsContent value="packages" className="mt-0">
              {packageManager}
            </TabsContent>

            <TabsContent value="assist" className="mt-0">
              {aiAssistant}
            </TabsContent>

            <TabsContent value="more" className="mt-0 grid gap-3">
              {onToggleNotebook && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm"><BookOpen className="h-4 w-4" /> Notebook</CardTitle>
                    <CardDescription>Switch between the lightweight editor and executable cells.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={closeThen(onToggleNotebook)}>
                      {isNotebookMode ? "Exit notebook" : "Open notebook"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {onOpenPlotBuilder && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4" /> Plot builder</CardTitle>
                    <CardDescription>Build a chart from the current data workspace.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={closeThen(onOpenPlotBuilder)}>Open plot builder</Button>
                  </CardContent>
                </Card>
              )}

              {onOpenTemplates && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm"><Library className="h-4 w-4" /> Templates</CardTitle>
                    <CardDescription>Start from a reusable code pattern when you actually need one.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={closeThen(onOpenTemplates)}>Browse templates</Button>
                  </CardContent>
                </Card>
              )}

              {workspaceManager && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm"><Cloud className="h-4 w-4" /> Cloud workspace</CardTitle>
                    <CardDescription>Optional cross-device workspace sync.</CardDescription>
                  </CardHeader>
                  <CardContent>{workspaceManager}</CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};
