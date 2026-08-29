import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { updatePageSEO, SEO_CONFIGS } from '@/utils/seo';

const Privacy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.privacy);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 px-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>

        <div className="prose dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: August 21, 2026</p>

          <h2>1. Local coding workspace</h2>
          <p>
            bIDE is designed to keep ordinary coding work local to your browser where possible. Code files and workspace state can be stored with browser storage such as IndexedDB, sessionStorage, or localStorage so you can continue working on the same device.
          </p>
          <ul>
            <li>Local code is not uploaded merely because you type or run it in a browser runtime.</li>
            <li>Clearing browser or site data can remove locally stored work.</li>
            <li>Features you explicitly choose—such as sharing, cloud workspaces, or Code Assist—can send the relevant data off-device to provide that feature.</li>
          </ul>

          <h2>2. Account information</h2>
          <p>
            If you sign in, bIDE may use a PocketBI-connected identity and authentication service. The service may process identifiers such as your account ID, email address, authentication/session information, and capability or entitlement state needed to provide connected features.
          </p>
          <p>You can use core browser coding features without creating a separate bIDE AI account or purchasing AI usage from bIDE.</p>

          <h2>3. Optional cloud and sharing features</h2>
          <p>
            When you explicitly save a cloud workspace or create a share link, the content needed for that feature is sent to the configured hosted service. Shared links should be treated as accessible to anyone who receives the link unless the product explicitly tells you otherwise.
          </p>
          <p>Do not put passwords, API keys, secrets, confidential data, or regulated information in content you plan to share publicly.</p>

          <h2>4. Optional Code Assist and your provider key</h2>
          <p>
            Code Assist is bring-your-own-key and is not required to run code. When you choose Ask, Review, or Complete, bIDE sends the prompt, relevant code context, selected model, and the API credential you supplied through the configured relay to the model provider so the provider can answer that request.
          </p>
          <ul>
            <li>The current bIDE interface stores the Code Assist key in browser session storage so it can be reused during that browser session.</li>
            <li>You can use the “Forget key” control to remove the key from the current bIDE session.</li>
            <li>The current relay is designed not to intentionally persist the API key or prompt/code as application records and does not include application logging of that request context.</li>
            <li>The model provider receives the request under the provider account associated with your key and handles it under that provider’s own terms and privacy practices.</li>
          </ul>
          <p>
            Do not send secrets or sensitive code to Code Assist unless you are authorized to send that information to the selected model provider.
          </p>

          <h2>5. Usage and analytics</h2>
          <p>
            bIDE may collect limited product and technical information needed to operate or improve the service, such as authentication events, feature operation metadata, error information, or basic device/browser information produced by the services we use.
          </p>
          <p>
            The public website also uses Plausible Analytics for aggregate website analytics. bIDE does not use third-party advertising pixels in the current public site configuration.
          </p>

          <h2>6. Third-party services</h2>
          <p>Depending on the feature you choose, data may be processed by service providers that support bIDE, including:</p>
          <ul>
            <li><strong>Supabase or connected PocketBI services:</strong> authentication and optional hosted product features.</li>
            <li><strong>Google Gemini:</strong> only when you choose Code Assist and provide a compatible API key.</li>
            <li><strong>Plausible:</strong> aggregate website analytics.</li>
            <li><strong>Hosting/CDN/runtime providers:</strong> delivery of the web application and browser runtime dependencies.</li>
          </ul>
          <p>bIDE does not currently operate a separate Stripe checkout or AI-token billing flow.</p>

          <h2>7. Data retention</h2>
          <p>Retention depends on the feature and where the data lives:</p>
          <ul>
            <li><strong>Local workspace data:</strong> remains in your browser until it is deleted, overwritten, or browser/site storage is cleared.</li>
            <li><strong>Shared or cloud content:</strong> remains according to the behavior of that feature until deleted, expired where applicable, or removed through account/support processes.</li>
            <li><strong>Account data:</strong> is retained as needed to provide and secure the connected account and to meet applicable legal requirements.</li>
            <li><strong>Code Assist session key:</strong> is stored in browser session storage and is removable with the in-product Forget key action.</li>
          </ul>

          <h2>8. Security</h2>
          <p>
            We use reasonable technical controls appropriate to the service, including HTTPS for network traffic and authentication controls for connected account features. No online service or local browser storage mechanism can guarantee absolute security.
          </p>

          <h2>9. Your choices</h2>
          <p>You can:</p>
          <ul>
            <li>use the core workspace without enabling Code Assist;</li>
            <li>remove your Code Assist key with Forget key;</li>
            <li>delete local files or clear bIDE browser storage;</li>
            <li>avoid or remove optional shared/cloud content where the feature provides that control; and</li>
            <li>contact support for account-access, deletion, or privacy requests.</li>
          </ul>

          <h2>10. Children</h2>
          <p>bIDE is not directed to children under 13, and we do not knowingly seek personal information from children under 13.</p>

          <h2>11. Changes to this policy</h2>
          <p>
            This policy may be updated as bIDE’s features and service providers change. The date at the top identifies the current version.
          </p>

          <h2>12. Contact</h2>
          <p>Privacy or account questions can be sent to <a href="mailto:support@pocketbi.app">support@pocketbi.app</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
