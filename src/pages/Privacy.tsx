import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Privacy = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container max-w-4xl py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="prose dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2>1. Information We Collect</h2>
          
          <h3>1.1 Account Information</h3>
          <p>
            When you create an account, we collect:
          </p>
          <ul>
            <li>Email address</li>
            <li>Full name</li>
            <li>Password (encrypted)</li>
          </ul>
          
          <h3>1.2 Usage Data</h3>
          <p>
            We automatically collect information about how you use OpenIDE:
          </p>
          <ul>
            <li>AI feature usage (number of uses, feature types)</li>
            <li>Code execution statistics (language, lines executed)</li>
            <li>Session duration and activity patterns</li>
            <li>Browser type and device information</li>
          </ul>
          
          <h3>1.3 Code and Content</h3>
          <p>
            We store:
          </p>
          <ul>
            <li>Code you write in the IDE (stored locally in your browser by default)</li>
            <li>Code you explicitly share using our sharing feature</li>
            <li>Lab progress and completion status</li>
          </ul>
          
          <h3>1.4 Payment Information</h3>
          <p>
            Payment processing is handled by Stripe. We do not store your credit card information. We only store:
          </p>
          <ul>
            <li>Stripe customer ID</li>
            <li>Subscription status and billing dates</li>
            <li>Transaction history</li>
          </ul>
          
          <h2>2. How We Use Your Information</h2>
          <p>
            We use your information to:
          </p>
          <ul>
            <li>Provide and maintain the OpenIDE service</li>
            <li>Process subscriptions and payments</li>
            <li>Track AI usage limits per tier</li>
            <li>Improve our AI features and user experience</li>
            <li>Send service-related communications</li>
            <li>Prevent fraud and abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
          
          <h2>3. Guest Users</h2>
          <p>
            For guest users (no account), we generate a browser fingerprint to track AI usage limits. This fingerprint is:
          </p>
          <ul>
            <li>Stored locally in your browser</li>
            <li>Used only to enforce the 3 AI uses per day limit</li>
            <li>Not tied to your personal identity</li>
            <li>Reset if you clear your browser data</li>
          </ul>
          
          <h2>4. Data Storage</h2>
          
          <h3>4.1 Local Storage</h3>
          <p>
            By default, your code is stored locally in your browser using IndexedDB. This means:
          </p>
          <ul>
            <li>Your code never leaves your device unless you explicitly share it</li>
            <li>We cannot access your local code</li>
            <li>Clearing browser data will delete your local code</li>
          </ul>
          
          <h3>4.2 Cloud Storage</h3>
          <p>
            For authenticated users, we store:
          </p>
          <ul>
            <li>Shared code snippets (until expiration or deletion)</li>
            <li>Lab progress and history</li>
            <li>AI usage records</li>
            <li>Account and profile information</li>
          </ul>
          
          <h2>5. Data Sharing</h2>
          <p>
            We do not sell your personal data. We share data only with:
          </p>
          <ul>
            <li><strong>Stripe:</strong> For payment processing</li>
            <li><strong>OpenAI/Gemini:</strong> For AI features (code only, no personal data)</li>
            <li><strong>Law Enforcement:</strong> When required by law</li>
          </ul>
          
          <h2>6. Code Sharing Privacy</h2>
          <p>
            When you share code:
          </p>
          <ul>
            <li>Anyone with the link can view the shared code</li>
            <li>Shared code is public unless you use Pro features (future: password protection)</li>
            <li>You control the expiration date</li>
            <li>You can delete shared code anytime</li>
          </ul>
          
          <h2>7. Data Security</h2>
          <p>
            We implement security measures including:
          </p>
          <ul>
            <li>Encrypted passwords</li>
            <li>HTTPS encryption for all data transmission</li>
            <li>Regular security audits</li>
            <li>Access controls and authentication</li>
          </ul>
          
          <h2>8. Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Export your data</li>
            <li>Opt out of marketing communications</li>
          </ul>
          
          <h2>9. Children's Privacy</h2>
          <p>
            OpenIDE is not intended for users under 13 years old. We do not knowingly collect information from children under 13.
          </p>
          
          <h2>10. Cookies and Tracking</h2>
          <p>
            We use:
          </p>
          <ul>
            <li>Essential cookies for authentication and session management</li>
            <li>LocalStorage for guest fingerprinting and code storage</li>
            <li>No third-party advertising or tracking cookies</li>
          </ul>
          
          <h2>11. Data Retention</h2>
          <p>
            We retain your data:
          </p>
          <ul>
            <li>Account data: Until you delete your account</li>
            <li>Shared code: Until expiration date or deletion</li>
            <li>AI usage records: 90 days for usage enforcement</li>
            <li>Payment records: As required by law (typically 7 years)</li>
          </ul>
          
          <h2>12. International Users</h2>
          <p>
            OpenIDE is operated in the United States. By using our service, you consent to the transfer and processing of your data 
            in the United States.
          </p>
          
          <h2>13. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the service.
          </p>
          
          <h2>14. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or want to exercise your rights, please contact us through the feedback form 
            on our website.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
