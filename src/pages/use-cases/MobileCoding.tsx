import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Smartphone, Zap, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updatePageSEO } from "@/utils/seo";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

const MobileCoding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO({
      title: 'Code Python, R, JavaScript & SQL on Mobile | bIDE',
      description: 'Use bIDE on iPhone, iPad, or Android for focused browser coding with Python, R, JavaScript and SQL. Save local files, create explicit cloud snapshots when signed in, and restore those snapshots on another device.',
      keywords: 'python on iphone, code on android, mobile python ide, iphone coding app, android code editor, mobile programming, browser ide',
      canonical: 'https://bideide.com/use-cases/mobile-coding'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://bideide.com/" },
        { name: "Use Cases", url: "https://bideide.com/use-cases/mobile-coding" },
        { name: "Mobile Coding", url: "https://bideide.com/use-cases/mobile-coding" }
      ]} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Code on Your Phone or Tablet</h1>
            <p className="text-xl text-muted-foreground">
              Use the same focused bIDE workspace on iPhone, iPad, Android, and desktop browsers.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-6 w-6" />
                Mobile Coding Experience
              </CardTitle>
              <CardDescription>
                The workspace condenses files, editor tools, and output for smaller screens instead of pretending a phone is a desktop monitor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Touch-Friendly Workspace</h3>
                    <p className="text-sm text-muted-foreground">
                      Mobile layouts keep the editor central and move secondary tools into focused drawers and sheets.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">iPhone & iPad</h3>
                    <p className="text-sm text-muted-foreground">
                      Use bIDE in Safari or another modern browser, and add the PWA to your home screen for app-like launching.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Android Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Use the browser workspace on Android phones and tablets and add it to the home screen when supported.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Browser-Local Execution</h3>
                    <p className="text-sm text-muted-foreground">
                      Supported runtimes execute in the browser. Initial runtime loading, package installation, account services, and uncached assets can still require an internet connection.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Explicit Cloud Snapshots</h3>
                    <p className="text-sm text-muted-foreground">
                      Signed-in users can save a workspace snapshot, then intentionally restore that snapshot on another device. bIDE does not silently live-sync edits between devices.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6" />
                Useful Mobile Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Practice or review code between classes</li>
                <li>• Run a quick Python, R, JavaScript, or SQL experiment</li>
                <li>• Inspect a CSV or query a local dataset on the go</li>
                <li>• Review and test code snippets</li>
                <li>• Share an unlisted code link with a classmate or teammate</li>
                <li>• Restore a cloud workspace snapshot on another device</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-6 w-6" />
                How It Works on Mobile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold mb-1">1. Open in Browser</h3>
                <p className="text-sm text-muted-foreground">
                  Visit bideide.com in a modern mobile browser.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">2. Add to Home Screen (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  Use your browser's Add to Home Screen action if you want an app-like launch icon.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">3. Code Locally, Snapshot Deliberately</h3>
                <p className="text-sm text-muted-foreground">
                  Local files stay in that browser. Sign in only when you want identity-connected features such as cloud workspace snapshots.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle>Try bIDE on Mobile</CardTitle>
              <CardDescription>
                No native app install is required to use the browser workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/ide")}
                size="lg"
                className="w-full sm:w-auto"
              >
                Open Mobile IDE
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MobileCoding;
