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
import { Sparkles, Package, Database, BrainCircuit, GraduationCap, Coffee, X, Sparkles as SparklesAlt, Cloud, BookOpen, Wrench, Languages, BarChart3, Library, FileDown, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

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
  mlOperations,
  labTrainer,
  about,
  recipeGallery,
  workspaceManager,
  onToggleNotebook,
  isNotebookMode,
  onOpenTranslate,
  onOpenPlotBuilder,
  onOpenTemplates,
  onOpenRTemplates,
  onExportPortfolio,
  currentLanguage = 'python',
}: FeatureDrawerProps) => {
  const localMode = !isSupabaseConfigured;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] pb-safe">
        <DrawerHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>Tools & Features</DrawerTitle>
              <DrawerDescription className="flex items-center gap-1.5">
                {localMode ? (
                  <><CloudOff className="h-3.5 w-3.5" /> Local Mode · browser tools only</>
                ) : (
                  <>AI assistance, packages, data operations, and learning tools</>
                )}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <Tabs defaultValue="tools" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start border-b rounded-none bg-background px-4">
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
            {!localMode && (
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
            )}
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
            {!localMode && (
              <TabsTrigger value="learn" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Learn</span>
              </TabsTrigger>
            )}
            {recipeGallery && (
              <TabsTrigger value="recipes" className="flex items-center gap-2">
                <SparklesAlt className="h-4 w-4" />
                <span className="hidden sm:inline">Recipes</span>
              </TabsTrigger>
            )}
            {!localMode && workspaceManager && (
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
            <TabsContent value="tools" className="mt-0 space-y-3">
              {!localMode && onOpenTranslate && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Languages className="w-5 h-5 text-blue-500" />
                      <CardTitle className="text-base">Translate Code</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Convert code between Python, R, JavaScript, and more</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => { onOpenTranslate(); onOpenChange(false); }} variant="outline" className="w-full" size="sm">
                      <Languages className="w-4 h-4 mr-2" /> Open Translator
                    </Button>
                  </CardContent>
                </Card>
              )}

              {onOpenPlotBuilder && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-500" />
                      <CardTitle className="text-base">Plot Builder</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Create charts and visualizations with a guided wizard</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => { onOpenPlotBuilder(); onOpenChange(false); }} variant="outline" className="w-full" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" /> Open Plot Builder
                    </Button>
                  </CardContent>
                </Card>
              )}

              {onOpenTemplates && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Library className="w-5 h-5 text-green-500" />
                      <CardTitle className="text-base">Code Templates</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Quick-start code snippets for common tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => { onOpenTemplates(); onOpenChange(false); }} variant="outline" className="w-full" size="sm">
                      <Library className="w-4 h-4 mr-2" /> Browse Templates
                    </Button>
                  </CardContent>
                </Card>
              )}

              {onOpenRTemplates && currentLanguage === 'r' && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-base">R Templates</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Statistical analysis templates for R</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => { onOpenRTemplates(); onOpenChange(false); }} variant="outline" className="w-full" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" /> Browse R Templates
                    </Button>
                  </CardContent>
                </Card>
              )}

              {onToggleNotebook && (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <CardTitle className="text-base">Notebook Mode</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Jupyter-style interactive coding with cells</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => { onToggleNotebook(); onOpenChange(false); }} variant={isNotebookMode ? "outline" : "default"} className="w-full" size="sm">
                      <BookOpen className="w-4 h-4 mr-2" /> {isNotebookMode ? 'Exit Notebook Mode' : 'Enable Notebook Mode'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {onExportPortfolio && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <FileDown className="w-5 h-5 text-orange-500" />
                      <CardTitle className="text-base">Export Portfolio</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Generate a portable HTML/PDF-style portfolio of your local work</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => { onExportPortfolio(); onOpenChange(false); }} variant="outline" className="w-full" size="sm">
                      <FileDown className="w-4 h-4 mr-2" /> Export Portfolio
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {!localMode && <TabsContent value="ai" className="mt-0 space-y-4">{aiAssistant}</TabsContent>}
            <TabsContent value="packages" className="mt-0">{packageManager}</TabsContent>
            <TabsContent value="data" className="mt-0 space-y-4">
              {dataLab}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold mb-3">Quick Operations</h3>
                {dataOperations}
              </div>
            </TabsContent>
            <TabsContent value="ml" className="mt-0">{mlOperations}</TabsContent>
            {!localMode && <TabsContent value="learn" className="mt-0">{labTrainer}</TabsContent>}
            {recipeGallery && <TabsContent value="recipes" className="mt-0">{recipeGallery}</TabsContent>}
            {!localMode && workspaceManager && <TabsContent value="cloud" className="mt-0">{workspaceManager}</TabsContent>}
            <TabsContent value="about" className="mt-0">{about}</TabsContent>
          </div>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};
