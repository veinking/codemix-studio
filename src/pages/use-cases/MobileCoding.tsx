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
      title: 'Code Python on iPhone & Android | Mobile Python IDE',
      description: 'Full-featured Python and R IDE for mobile. Code on iPhone, iPad, or Android. Works offline, syncs across devices. Free mobile coding app - no installation required.',
      keywords: 'python on iphone, code on android, mobile python ide, iphone coding app, android code editor, mobile programming, pythonista alternative',
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
            <h1 className="text-4xl font-bold mb-4">Code Python & R on Your Phone</h1>
            <p className="text-xl text-muted-foreground">
              Full IDE for iPhone, iPad, and Android. Code anywhere, anytime.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-6 w-6" />
                Mobile-First Coding Experience
              </CardTitle>
              <CardDescription>
                Designed to work perfectly on mobile devices. Not just a desktop app squeezed onto a small screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Touch-Optimized Interface</h3>
                    <p className="text-sm text-muted-foreground">
                      Large buttons, swipe gestures, and mobile-friendly code editor. Designed for your thumbs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Works on iPhone & iPad</h3>
                    <p className="text-sm text-muted-foreground">
                      Install as a PWA on iOS. Works in Safari, Chrome, or any mobile browser.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Android Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Perfect companion for Android tablets and phones. Add to home screen for app-like experience.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Offline Capable</h3>
                    <p className="text-sm text-muted-foreground">
                      Code on planes, trains, or anywhere without WiFi. Everything runs locally in your browser.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Auto-Sync Across Devices</h3>
                    <p className="text-sm text-muted-foreground">
                      Start on your phone, finish on your laptop. Your code syncs automatically.
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
                Perfect Mobile Use Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Code between classes on campus</li>
                <li>• Practice coding during your commute</li>
                <li>• Quick fixes and debugging on the go</li>
                <li>• Review and test code snippets</li>
                <li>• Learn Python/R with mobile tutorials</li>
                <li>• Share code instantly with classmates</li>
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
                  Visit bideide.com on Safari (iOS) or Chrome (Android)
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">2. Add to Home Screen</h3>
                <p className="text-sm text-muted-foreground">
                  Tap Share → Add to Home Screen for app-like experience
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">3. Start Coding</h3>
                <p className="text-sm text-muted-foreground">
                  Launch from home screen and code like a native app
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle>Try Mobile Coding Now</CardTitle>
              <CardDescription>
                Works on iPhone, iPad, and Android. No app store required.
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
