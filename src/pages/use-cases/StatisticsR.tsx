import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, BarChart3, TrendingUp, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updatePageSEO } from "@/utils/seo";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const StatisticsR = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO({
      title: 'Free Online R IDE for Statistics Students | Run R in Browser',
      description: 'Free R programming IDE for statistics courses. Run tidyverse, ggplot2, dplyr in your browser. Perfect for stats students - no RStudio installation needed. Works on mobile & desktop.',
      keywords: 'r programming online, r ide for students, rstudio alternative, free r editor, tidyverse online, ggplot2 browser, learn r statistics',
      canonical: 'https://codemixapp.com/use-cases/statistics-r-programming'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://codemixapp.com/" },
        { name: "Use Cases", url: "https://codemixapp.com/use-cases/statistics-r-programming" },
        { name: "Statistics & R Programming", url: "https://codemixapp.com/use-cases/statistics-r-programming" }
      ]} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Free Online R IDE for Statistics Students</h1>
            <p className="text-xl text-muted-foreground">
              Run R code instantly in your browser. No RStudio installation required.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-6 w-6" />
                Why Statistics Students Love OpenIDE
              </CardTitle>
              <CardDescription>
                Everything RStudio offers, right in your browser. Free forever.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Tidyverse & ggplot2 Ready</h3>
                    <p className="text-sm text-muted-foreground">
                      dplyr, tidyr, ggplot2, and more. All your favorite R packages, no installation needed.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Statistical Analysis Tools</h3>
                    <p className="text-sm text-muted-foreground">
                      Hypothesis testing, regression, ANOVA, and all statistical methods taught in your courses.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Data Visualization</h3>
                    <p className="text-sm text-muted-foreground">
                      Create publication-quality plots with ggplot2. Export for reports and presentations.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Works on School Computers</h3>
                    <p className="text-sm text-muted-foreground">
                      No admin rights needed. Access from any browser, including restricted lab computers.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">AI R Code Helper</h3>
                    <p className="text-sm text-muted-foreground">
                      Get instant help with R syntax, debugging, and statistical methods.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Perfect for These Statistics Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Introduction to Statistics</li>
                <li>• Statistical Methods & Data Analysis</li>
                <li>• Regression Analysis</li>
                <li>• Biostatistics</li>
                <li>• Econometrics</li>
                <li>• Experimental Design</li>
                <li>• Time Series Analysis</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Common R Tasks Made Easy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Import and clean CSV datasets</li>
                <li>• Run t-tests and ANOVA</li>
                <li>• Build linear and logistic regression models</li>
                <li>• Create histograms, boxplots, and scatterplots</li>
                <li>• Calculate descriptive statistics</li>
                <li>• Perform hypothesis tests</li>
                <li>• Generate correlation matrices</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-secondary/5 border-secondary/20">
            <CardHeader>
              <CardTitle>Start Using R Today</CardTitle>
              <CardDescription>
                No downloads, no setup. Just open and code.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/ide")} 
                size="lg"
                className="w-full sm:w-auto"
              >
                Launch R IDE - Free
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StatisticsR;
