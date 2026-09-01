import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Code2, BarChart3, Database, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updatePageSEO } from "@/utils/seo";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const DataScienceStudents = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO({
      title: "Browser Python Workspace for Data Science Students | bIDE",
      description: "Use bIDE for browser-based Python and SQL coursework with CSV data, supported packages, plot tools, files, output, and optional bring-your-own-key Code Assist.",
      keywords: "python ide for students, data science browser ide, csv analysis, python coursework, sql coursework, browser coding workspace",
      canonical: "https://bideide.com/use-cases/data-science-students",
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://bideide.com/" },
        { name: "Use Cases", url: "https://bideide.com/use-cases/data-science-students" },
        { name: "Data Science Students", url: "https://bideide.com/use-cases/data-science-students" },
      ]} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Browser Python Workspace for Data Science Students</h1>
            <p className="text-xl text-muted-foreground">
              Keep code, CSV data, files, output, and optional assistance in one browser workspace without requiring a local Python setup.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-6 w-6" />
                A focused path for coursework
              </CardTitle>
              <CardDescription>
                bIDE centers the editor and runtime first. Data utilities and Code Assist stay optional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Run Python in the browser</h3>
                    <p className="text-sm text-muted-foreground">Write and execute Python without installing a local toolchain first.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Work with CSV data</h3>
                    <p className="text-sm text-muted-foreground">Upload CSV files and use them from Python, SQL, or the built-in data workspace.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Use guided data operations</h3>
                    <p className="text-sm text-muted-foreground">Filter, sort, group, and transform data when you do not want to hand-write every operation.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Load supported packages</h3>
                    <p className="text-sm text-muted-foreground">Use supported browser-compatible Python packages when your assignment needs more than the base runtime.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Plot when the task needs it</h3>
                    <p className="text-sm text-muted-foreground">Create or inspect charts with the available plot tools while keeping visualization secondary to the coding workflow.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Optional Code Assist</h3>
                    <p className="text-sm text-muted-foreground">Bring your own Gemini API key when you want Ask, Review, or Complete. No AI key is required for normal coding.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-6 w-6" />
                Useful for common student workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Explore and clean CSV coursework data</li>
                <li>• Practice Python and SQL side by side</li>
                <li>• Run descriptive analysis with supported packages</li>
                <li>• Create plots for assignments and reports</li>
                <li>• Keep code files and output together in one browser session</li>
                <li>• Share an unlisted code link when collaboration calls for it</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Know the browser-runtime boundary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>bIDE is a browser workspace, not a promise that every desktop Python package, GPU workload, or native dependency will run unchanged.</p>
              <p>Package compatibility varies by browser runtime. Keep important work downloaded or use an explicit signed-in workspace snapshot when you want a deliberate cloud restore point.</p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                Start with the editor
              </CardTitle>
              <CardDescription>
                Open bIDE and add secondary tools only when your assignment needs them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/ide")} size="lg" className="w-full sm:w-auto">
                Open bIDE
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataScienceStudents;
