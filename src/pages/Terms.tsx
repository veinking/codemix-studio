import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { updatePageSEO, SEO_CONFIGS } from '@/utils/seo';

const Terms = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.terms);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 px-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>

        <div className="prose dark:prose-invert max-w-none">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: August 21, 2026</p>

          <h2>1. Using bIDE</h2>
          <p>
            bIDE is a browser coding workspace. By using the service, you agree to use it lawfully and in a way that does not damage, disrupt, probe, or misuse the service or other users’ data.
          </p>

          <h2>2. Local workspace and browser runtimes</h2>
          <p>
            Core coding features can run in your browser. Browser runtimes, WebAssembly packages, local storage, and third-party libraries have technical limits and may behave differently from a full local development environment.
          </p>
          <p>
            You are responsible for keeping backups of code or data that matters to you. Clearing browser storage, browser failures, device loss, or unsupported runtime behavior can remove locally stored work.
          </p>

          <h2>3. Accounts and connected services</h2>
          <p>
            Some optional features use a PocketBI-connected identity or hosted services, such as cloud workspaces or code sharing. You are responsible for safeguarding your account credentials and for activity performed through your account.
          </p>
          <p>
            bIDE does not currently maintain a separate AI subscription or AI-token checkout. If a connected PocketBI service has its own paid plan or terms, those are managed by that service rather than by a separate bIDE AI plan.
          </p>

          <h2>4. Optional Code Assist</h2>
          <p>
            Code Assist is optional and bring-your-own-key. When you choose Ask, Review, or Complete, bIDE sends the relevant prompt/code and the API credential you provide through the configured relay to the selected model provider so that provider can fulfill your request.
          </p>
          <ul>
            <li>You are responsible for the provider account, API key, provider charges, and provider terms.</li>
            <li>Do not submit secrets, credentials, regulated data, or confidential code unless you are permitted to send that information to the model provider.</li>
            <li>Generated suggestions may be wrong or insecure. Review them before using or applying them.</li>
            <li>bIDE does not automatically apply generated code without your action.</li>
          </ul>

          <h2>5. Your code and content</h2>
          <p>
            You retain your rights in code and content you create. You grant bIDE only the permissions reasonably needed to provide features you explicitly use, such as storing a cloud workspace or serving a shared-code link.
          </p>

          <h2>6. Sharing</h2>
          <p>
            If you create a share link, anyone who receives that link may be able to view the shared content. Do not place passwords, API keys, confidential data, or other secrets in content you intend to share.
          </p>

          <h2>7. Third-party software and services</h2>
          <p>
            bIDE relies on third-party libraries, browser runtimes, hosting, authentication, analytics, and optional model-provider services. Their availability and behavior can change independently of bIDE, and their own terms may apply to your use of those services.
          </p>

          <h2>8. Prohibited use</h2>
          <p>You may not use bIDE to:</p>
          <ul>
            <li>violate applicable law or another person’s rights;</li>
            <li>distribute malware or intentionally harmful code;</li>
            <li>attempt unauthorized access to accounts, infrastructure, or data;</li>
            <li>circumvent reasonable service limits or abuse automated endpoints; or</li>
            <li>misrepresent ownership or authorization for code or data you submit.</li>
          </ul>

          <h2>9. Service changes</h2>
          <p>
            Features may be added, changed, limited, or removed as bIDE evolves. We may also suspend functionality when necessary for security, reliability, maintenance, or legal reasons.
          </p>

          <h2>10. No warranty</h2>
          <p>
            bIDE is provided on an “as is” and “as available” basis to the extent permitted by law. Code execution, generated suggestions, data tools, and third-party runtimes may contain errors or become unavailable.
          </p>

          <h2>11. Limitation of liability</h2>
          <p>
            To the extent permitted by law, bIDE and its operators are not responsible for indirect, incidental, special, consequential, or lost-profit damages arising from use of the service, loss of local data, third-party outages, or reliance on generated output.
          </p>

          <h2>12. Privacy</h2>
          <p>Your use of bIDE is also governed by the Privacy Policy available in the product.</p>

          <h2>13. Changes to these terms</h2>
          <p>
            These terms may be updated as the product changes. The date at the top of this page identifies the current version.
          </p>

          <h2>14. Contact</h2>
          <p>Questions about these terms can be sent to <a href="mailto:support@bideide.com">support@bideide.com</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
