import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { updatePageSEO, SEO_CONFIGS } from "@/utils/seo";

const Terms = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.terms);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container max-w-4xl py-12">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="prose dark:prose-invert max-w-none">
          <h1>bIDE Terms of Service</h1>
          <p className="text-muted-foreground">Effective August 11, 2026</p>

          <h2>1. Use of bIDE</h2>
          <p>bIDE is a browser-based development environment and a PocketBI product. You may use it for lawful personal, educational, or commercial coding and data work.</p>

          <h2>2. Local mode</h2>
          <p>Core browser workflows may be available without an account. Local project data can be stored in browser storage and may be lost if you clear browser data, change devices, or remove local storage.</p>

          <h2>3. Optional online services</h2>
          <p>Accounts, cloud save, sharing, AI assistance, usage limits, subscriptions, and other online features may be enabled or disabled depending on the current service configuration. Availability of one feature does not guarantee availability of every online feature.</p>

          <h2>4. Your code and content</h2>
          <p>You retain rights in the code and content you create, subject to any third-party rights that apply. You are responsible for ensuring that content you run, upload, share, or submit to an AI feature is lawful and that you have permission to use it.</p>

          <h2>5. AI and generated output</h2>
          <p>AI-generated code, explanations, translations, or recommendations can be inaccurate. Review and test generated output before relying on it, especially for security-sensitive, production, or high-impact uses.</p>

          <h2>6. Payments and subscriptions</h2>
          <p>If paid plans are enabled, pricing, billing intervals, cancellation terms, and refund rules will be presented in the applicable checkout flow. Payment processing may be handled by a third-party payment provider.</p>

          <h2>7. Shared content</h2>
          <p>If code-sharing features are enabled, anyone with a valid share link may be able to view the shared content. Do not share passwords, API keys, access tokens, regulated data, or confidential code unless you intend the recipient to access it.</p>

          <h2>8. Prohibited uses</h2>
          <ul>
            <li>Violating law or third-party rights</li>
            <li>Distributing malware or intentionally harmful code</li>
            <li>Attempting unauthorized access to accounts or infrastructure</li>
            <li>Abusing automated requests or service limits</li>
          </ul>

          <h2>9. Availability</h2>
          <p>bIDE may change, suspend, or remove features as the product evolves. Local and cloud capabilities may differ, and online services may occasionally be unavailable.</p>

          <h2>10. Disclaimer</h2>
          <p>bIDE is provided on an “as available” basis. You are responsible for maintaining backups of important work and validating code or data outputs before using them in production or other consequential settings.</p>

          <h2>11. Privacy</h2>
          <p>Your use of bIDE is also subject to the bIDE Privacy Policy and the shared PocketBI Privacy Center.</p>

          <h2>12. Contact</h2>
          <p>Questions can be sent to <a href="mailto:support@proairesume.com?subject=bIDE%20Terms">support@proairesume.com</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
