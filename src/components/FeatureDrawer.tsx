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
import { Sparkles, Package, Database, BrainCircuit, GraduationCap, Coffee, X, Sparkles as SparklesAlt, Cloud, BookOpen } from "lucide-react";
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
  about,
  recipeGallery,
  workspaceManager,
  onToggleNotebook,
  isNotebookMode,
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
            {recipeGallery && (
              <TabsTrigger value="recipes" className="flex items-center gap-2">
                <SparklesAlt className="h-4 w-4" />
                <span className="hidden sm:inline">Recipes</span>
              </TabsTrigger>
            )}
            {workspaceManager && (
              <TabsTrigger value="cloud" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span className="hidden sm:inline">Cloud</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="ai" className="mt-0 space-y-4">
              {/* Notebook Mode Feature Card */}
              {onToggleNotebook && (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <CardTitle className="text-base">Notebook Mode</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Jupyter-style interactive coding with cells
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {isNotebookMode 
                        ? "You're currently in Notebook Mode. Mix code and documentation in cells."
                        : "Switch to Notebook Mode for a Jupyter-like experience with executable code cells and markdown documentation."}
                    </p>
                    <Button
                      onClick={() => {
                        onToggleNotebook();
                        onOpenChange(false);
                      }}
                      variant={isNotebookMode ? "outline" : "default"}
                      className="w-full"
                      size="sm"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      {isNotebookMode ? 'Exit Notebook Mode' : 'Enable Notebook Mode'}
                    </Button>
                  </CardContent>
                </Card>
              )}
              
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
            {recipeGallery && (
              <TabsContent value="recipes" className="mt-0">
                {recipeGallery}
              </TabsContent>
            )}
            {workspaceManager && (
              <TabsContent value="cloud" className="mt-0">
                {workspaceManager}
              </TabsContent>
            )}
            <TabsContent value="about" className="mt-0">
              {about}
            </TabsContent>
          </div>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};
