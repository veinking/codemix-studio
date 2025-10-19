import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updatePageSEO } from "@/utils/seo";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const VsGoogleColab = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO({
      title: 'bIDE vs Google Colab | Best Free Python IDE Comparison 2025',
      description: 'Compare bIDE and Google Colab for students. Learn which free Python IDE is better for data science, machine learning, and coursework. Side-by-side feature comparison.',
      keywords: 'bide vs colab, google colab alternative, free python ide comparison, best jupyter alternative, student coding tools',
      canonical: 'https://codemixapp.com/comparisons/bide-vs-google-colab'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://codemixapp.com/" },
        { name: "Comparisons", url: "https://codemixapp.com/comparisons/bide-vs-google-colab" },
        { name: "bIDE vs Google Colab", url: "https://codemixapp.com/comparisons/bide-vs-google-colab" }
      ]} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">bIDE vs Google Colab</h1>
            <p className="text-xl text-muted-foreground">
              Which free Python IDE is better for students? Here&apos;s an honest comparison.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Feature</th>
                      <th className="text-center py-3 px-4">bIDE</th>
                      <th className="text-center py-3 px-4">Google Colab</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3 px-4">Works Offline</td>
                      <td className="text-center py-3 px-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">No Google Account Required</td>
                      <td className="text-center py-3 px-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Mobile Optimized</td>
                      <td className="text-center py-3 px-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">R Programming Support</td>
                      <td className="text-center py-3 px-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">AI Code Assistant</td>
                      <td className="text-center py-3 px-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Free GPU Access</td>
                      <td className="text-center py-3 px-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Jupyter Notebook Interface</td>
                      <td className="text-center py-3 px-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Privacy (No Data Mining)</td>
                      <td className="text-center py-3 px-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Built by Students</td>
                      <td className="text-center py-3 px-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>When to Use bIDE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">✅ You need offline access</p>
                <p className="text-sm text-muted-foreground">✅ You code on mobile devices</p>
                <p className="text-sm text-muted-foreground">✅ You use R programming</p>
                <p className="text-sm text-muted-foreground">✅ You want privacy-focused tools</p>
                <p className="text-sm text-muted-foreground">✅ You don&apos;t have a Google account</p>
                <p className="text-sm text-muted-foreground">✅ You prefer lightweight tools</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>When to Use Google Colab</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">✅ You need GPU for deep learning</p>
                <p className="text-sm text-muted-foreground">✅ You work with large datasets (&gt;1GB)</p>
                <p className="text-sm text-muted-foreground">✅ You train complex neural networks</p>
                <p className="text-sm text-muted-foreground">✅ You need Google Drive integration</p>
                <p className="text-sm text-muted-foreground">✅ You&apos;re doing heavy ML research</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>The Bottom Line</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                <strong>For most students:</strong> bIDE is better for coursework, quick coding, and learning. 
                It works offline, on mobile, and doesn&apos;t require a Google account.
              </p>
              <p className="text-muted-foreground">
                <strong>For ML researchers:</strong> Google Colab wins if you need GPU power for training large models.
              </p>
              <p className="text-muted-foreground">
                <strong>Best approach:</strong> Use both! bIDE for daily coding and R work, Colab for GPU-intensive tasks.
              </p>
              <Button onClick={() => navigate("/ide")} size="lg" className="mt-4">
                Try bIDE Free
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VsGoogleColab;
