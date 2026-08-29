import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updatePageSEO, SEO_CONFIGS } from "@/utils/seo";

const Support = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.support);
  }, []);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I contact bIDE support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Email support@pocketbi.app for technical support, access questions, or general inquiries."
        }
      },
      {
        "@type": "Question",
        "name": "What is the expected response time for support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Support inquiries are generally reviewed within 24-48 hours during business days, but response times can vary."
        }
      },
      {
        "@type": "Question",
        "name": "Where can I find help before contacting support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Check the current Documentation hub and Features page first. Include relevant error messages or screenshots in your support request, but never include passwords, API keys, or access tokens."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-2xl mx-auto pt-12">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Support</CardTitle>
            <CardDescription>Help with bIDE access and the current browser workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Contact</h2>
              <p className="text-muted-foreground">
                For technical support, access questions, or general inquiries, email bIDE support.
              </p>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <a href="mailto:support@pocketbi.app" className="text-lg font-medium hover:text-primary transition-colors">
                  support@pocketbi.app
                </a>
              </div>
              <p className="text-sm text-muted-foreground">Never send passwords, API keys, refresh tokens, access tokens, or private share links in a support email.</p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Before You Contact Support</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Check the <Button variant="link" onClick={() => navigate("/docs")} className="p-0 h-auto">Documentation</Button> for the current Python, R, JavaScript, and SQL runtime scope</li>
                <li>• Review the <Button variant="link" onClick={() => navigate("/features")} className="p-0 h-auto">Features</Button> page for current product capabilities</li>
                <li>• Include relevant error text or a screenshot with secrets removed</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Expected Response Time</h2>
              <p className="text-muted-foreground">
                Inquiries are generally reviewed within 24-48 hours during business days, although response times can vary.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
