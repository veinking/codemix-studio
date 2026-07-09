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
      title: 'Free Python IDE for Data Science Students | bIDE',
      description: 'Perfect Python IDE for data science students. Run pandas, numpy, matplotlib in your browser. Free Jupyter notebook alternative with AI assistance. Works on any device - no installation required.',
      keywords: 'python ide for students, data science ide, free jupyter alternative, pandas online, numpy browser, learn data science, student coding tools',
      canonical: 'https://bideide.com/use-cases/data-science-students'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://bideide.com/" },
        { name: "Use Cases", url: "https://bideide.com/use-cases/data-science-students" },
        { name: "Data Science Students", url: "https://bideide.com/use-cases/data-science-students" }
      ]} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Free Python IDE for Data Science Students</h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to learn data science, run in your browser, completely free.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-6 w-6" />
                Why bIDE is Perfect for Data Science Students
              </CardTitle>
              <CardDescription>
                Built by a student, for students. No installation, no credit card, no limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Run Pandas & NumPy Instantly</h3>
                    <p className="text-sm text-muted-foreground">
                      No setup required. Start analyzing data with pandas, numpy, and scipy right in your browser.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Data Visualization Built-In</h3>
                    <p className="text-sm text-muted-foreground">
                      Create charts with matplotlib, seaborn, and plotly. Export visualizations for your assignments.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">AI Code Assistant</h3>
                    <p className="text-sm text-muted-foreground">
                      Stuck on homework? Get AI-powered help to debug, explain, and optimize your code.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Works on iPhone & Android</h3>
                    <p className="text-sm text-muted-foreground">
                      Code between classes on your phone. All your work syncs automatically.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">CSV Upload & Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload datasets from your courses and analyze them with built-in data operations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-6 w-6" />
                Perfect for These Data Science Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Introduction to Data Science</li>
                <li>• Statistical Analysis & Probability</li>
                <li>• Machine Learning Fundamentals</li>
                <li>• Data Visualization</li>
                <li>• Business Analytics</li>
                <li>• Research Methods</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Example Student Projects You Can Build
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Analyze campus survey data with pandas</li>
                <li>• Build linear regression models for predictions</li>
                <li>• Create interactive data dashboards</li>
                <li>• Clean and visualize real-world datasets</li>
                <li>• Perform hypothesis testing and statistical analysis</li>
                <li>• Build classification models with scikit-learn</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                Start Learning Data Science Today
              </CardTitle>
              <CardDescription>
                Join thousands of students using bIDE for their data science courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/ide")} 
                size="lg"
                className="w-full sm:w-auto"
              >
                Launch IDE - It's Free
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataScienceStudents;
