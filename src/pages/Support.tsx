import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updatePageSEO, SEO_CONFIGS } from "@/utils/seo";

const SUPPORT_EMAIL = "support@proairesume.com";

const Support = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.support);
  }, []);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I contact bIDE support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Email ${SUPPORT_EMAIL} for technical support or general inquiries. Include bIDE in the subject line.`,
        },
      },
      {
        "@type": "Question",
        name: "Can I use bIDE without an account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Core local browser workflows can run without an account. Cloud, AI, sharing, or payment features may require configured online services.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-2xl mx-auto pt-12">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">bIDE Support</CardTitle>
            <CardDescription>bIDE is a PocketBI product. Support uses the developer's shared inbox.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Contact</h2>
              <p className="text-muted-foreground">For technical support or general inquiries, include “bIDE” in the subject line plus your browser and the language/runtime involved.</p>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <a href={`mailto:${SUPPORT_EMAIL}?subject=bIDE%20Support`} className="text-lg font-medium hover:text-primary transition-colors">{SUPPORT_EMAIL}</a>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Local mode</h2>
              <p className="text-muted-foreground">If cloud services are unavailable, core browser execution and local project workflows can still be used. Login, cloud sync, AI requests, sharing, and payments may be disabled until the backend is configured.</p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Before contacting support</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Refresh the page and retry the same action.</li>
                <li>• Include the browser, device, language/runtime, and exact error text.</li>
                <li>• Do not email passwords, API keys, access tokens, or confidential code.</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate("/privacy")}>bIDE Privacy</Button>
              <Button variant="outline" asChild>
                <a href="https://pocketbi.app/privacy-center.html">PocketBI Privacy Center <ExternalLink className="ml-2 h-4 w-4" /></a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
