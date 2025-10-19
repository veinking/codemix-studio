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
        "name": "How do I contact OpenIDE support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Email us at Support@proairesume.com for technical support, billing questions, or general inquiries. We're here to help you get the most out of OpenIDE."
        }
      },
      {
        "@type": "Question",
        "name": "What is the expected response time for support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We typically respond to support inquiries within 24-48 hours during business days."
        }
      },
      {
        "@type": "Question",
        "name": "Where can I find help before contacting support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Check our Tutorials page for common solutions and the Features page to understand available capabilities. Include any error messages or screenshots in your support request for faster assistance."
        }
      }
    ]
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      {/* FAQ Schema for SEO */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="max-w-2xl mx-auto pt-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Support</CardTitle>
            <CardDescription>
              We're here to help you get the most out of OpenIDE
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Contact Us</h2>
              <p className="text-muted-foreground">
                For technical support, billing questions, or general inquiries, please reach out to our support team.
              </p>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <a 
                  href="mailto:Support@proairesume.com"
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  Support@proairesume.com
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Before You Contact Us</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Check our <Button variant="link" onClick={() => navigate("/tutorials")} className="p-0 h-auto">Tutorials</Button> for common solutions</li>
                <li>• Review the <Button variant="link" onClick={() => navigate("/features")} className="p-0 h-auto">Features</Button> page to understand available capabilities</li>
                <li>• Include any error messages or screenshots in your support request</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Expected Response Time</h2>
              <p className="text-muted-foreground">
                We typically respond to support inquiries within 24-48 hours during business days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
