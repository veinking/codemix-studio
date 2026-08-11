import { useEffect } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { updatePageSEO, SEO_CONFIGS } from "@/utils/seo";

const Privacy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.privacy);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container max-w-4xl py-12">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="prose dark:prose-invert max-w-none">
          <h1>bIDE Privacy Policy</h1>
          <p className="text-muted-foreground">Effective August 11, 2026</p>
          <p>
            bIDE is a PocketBI product. This page summarizes bIDE's privacy practices; the stable developer-hosted version is also available through the PocketBI Privacy Center.
          </p>

          <h2>1. Local browser mode</h2>
          <p>
            Core bIDE workflows can run in the browser without an account. Project files, editor state, preferences, and related local information may be stored in browser storage such as IndexedDB or localStorage.
          </p>
          <p>
            When cloud services are not configured or not used, locally stored project content remains in the browser environment except when you intentionally export, share, or submit content to an online feature.
          </p>

          <h2>2. Code execution</h2>
          <p>
            Supported runtimes may execute code in the browser using WebAssembly-based technologies. Local browser execution does not require sending source code to a bIDE server merely to run the local workflow.
          </p>

          <h2>3. Optional accounts and cloud features</h2>
          <p>
            If account, cloud-save, sharing, usage-management, or subscription features are enabled, bIDE may process information such as your email address, account identifier, project metadata, shared content, usage records, and entitlement information through the configured service providers.
          </p>

          <h2>4. AI-assisted features</h2>
          <p>
            AI-assisted coding, translation, explanation, training, or data-advisor features may send the prompt, code, error text, or other content you intentionally submit to the configured AI service in order to generate a response. Do not submit confidential or regulated information unless you are authorized to do so.
          </p>

          <h2>5. Payments</h2>
          <p>
            If paid web plans are enabled, payment processing may be handled by a third-party payment provider. bIDE does not need to store your full payment-card number to provide IDE functionality.
          </p>

          <h2>6. Website and technical information</h2>
          <p>
            Standard hosting and security infrastructure may process technical information such as IP address, browser/device information, request metadata, and timestamps needed to deliver and protect the service.
          </p>

          <h2>7. Data sharing</h2>
          <p>
            bIDE does not sell project source code or datasets for targeted advertising. Information may be processed by service providers when needed to provide hosting, authentication, AI, payment, sharing, or support features that you use.
          </p>

          <h2>8. Retention and deletion</h2>
          <p>
            Local browser data can generally be removed by deleting projects or clearing browser storage. For information associated with an optional online account or a support request, contact support to ask about deletion where applicable.
          </p>

          <h2>9. Security</h2>
          <p>
            Reasonable technical measures are used for the services that are enabled. No storage or transmission method can be guaranteed to be completely secure.
          </p>

          <h2>10. Changes</h2>
          <p>
            This policy may be updated as bIDE's cloud, AI, account, payment, or analytics capabilities change. Material changes should also be reflected in the shared PocketBI Privacy Center.
          </p>

          <h2>11. Contact</h2>
          <p>
            Privacy questions can be sent to <a href="mailto:support@proairesume.com?subject=bIDE%20Privacy">support@proairesume.com</a>.
          </p>
          <p>
            <a href="https://pocketbi.app/privacy-bide.html" className="inline-flex items-center gap-1">
              View the stable bIDE policy on PocketBI <ExternalLink className="h-4 w-4" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
