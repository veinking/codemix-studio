import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, BarChart3, TrendingUp, Calculator, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updatePageSEO } from "@/utils/seo";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const StatisticsR = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO({
      title: "Browser R Workspace for Statistics Students | bIDE",
      description: "Run R in the browser for statistics coursework with files, CSV data, output, plot workflows, and optional bring-your-own-key Code Assist.",
      keywords: "r programming online, r browser ide, statistics students, r coursework, csv analysis, browser coding workspace",
      canonical: "https://bideide.com/use-cases/statistics-r-programming",
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://bideide.com/" },
        { name: "Use Cases", url: "https://bideide.com/use-cases/statistics-r-programming" },
        { name: "Statistics & R Programming", url: "https://bideide.com/use-cases/statistics-r-programming" },
      ]} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Browser R Workspace for Statistics Students</h1>
            <p className="text-xl text-muted-foreground">
              Run R, inspect CSV data, keep files and output together, and add secondary tools only when the assignment needs them.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-6 w-6" />
                A practical R workflow in the browser
              </CardTitle>
              <CardDescription>
                bIDE is a focused browser R workspace, not a claim to replace every desktop RStudio capability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Run R without a local install</h3>
                    <p className="text-sm text-muted-foreground">Write and execute R directly from the browser workspace.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Bring in CSV coursework data</h3>
                    <p className="text-sm text-muted-foreground">Upload CSV files and work with them from R or the built-in data workspace.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Keep analysis output close to the code</h3>
                    <p className="text-sm text-muted-foreground">Use the editor, files, console output, and available plot workflows in the same browser session.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Practice common statistics workflows</h3>
                    <p className="text-sm text-muted-foreground">Use R for descriptive statistics, hypothesis tests, regression exercises, and visualization code supported by the browser runtime.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Optional Code Assist</h3>
                    <p className="text-sm text-muted-foreground">Bring your own Gemini API key when you want Ask, Review, or Complete. Normal R execution does not require an AI key.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Useful for common statistics coursework
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Descriptive statistics and exploratory analysis</li>
                <li>• Hypothesis-testing exercises</li>
                <li>• Linear and logistic regression practice</li>
                <li>• CSV cleaning and transformation</li>
                <li>• Plotting and visualization code</li>
                <li>• Reproducible code examples for reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Browser-runtime boundaries matter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>Package and native-dependency compatibility can differ from desktop R. Check the runtime when a course depends on a specific package rather than assuming every desktop package is available.</p>
              <p>Keep important work downloaded, and use an explicit signed-in workspace snapshot when you want a deliberate cloud restore point instead of automatic live sync.</p>
            </CardContent>
          </Card>

          <Card className="bg-secondary/5 border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-6 w-6" />Start with R</CardTitle>
              <CardDescription>Open the editor first, then add data or assistance tools only when the task needs them.</CardDescription>
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

export default StatisticsR;
