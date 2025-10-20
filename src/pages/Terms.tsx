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
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using OpenIDE, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
          
          <h2>2. Use License</h2>
          <p>
            OpenIDE grants you a personal, non-exclusive, non-transferable license to use the service for your personal or commercial projects,
            subject to these Terms of Service.
          </p>
          
          <h2>3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding 
            your account and for all activities that occur under your account.
          </p>
          
          <h2>4. Subscription Tiers</h2>
          <p>
            OpenIDE offers different subscription tiers:
          </p>
          <ul>
            <li><strong>Guest:</strong> No AI access, no account required</li>
            <li><strong>Free Account:</strong> 3 AI uses every 5 days, includes code sharing and progress tracking</li>
            <li><strong>Pro Account:</strong> Unlimited AI usage, priority processing, and advanced features for $7.99/month</li>
          </ul>
          
          <h2>5. AI Usage Limits</h2>
          <p>
            AI usage limits use a 5-day rolling window. Usage is counted over the past 5 days from the current moment. 
            Usage limits apply across all AI features including code assistance, error explanations, code translation, 
            lab training, and data analysis.
          </p>
          
          <h2>6. User Content</h2>
          <p>
            You retain all rights to the code and content you create using OpenIDE. By using our service, you grant us the right 
            to store and process your code for the purpose of providing the service.
          </p>
          
          <h2>7. Refunds and Cancellations</h2>
          <p>
            <strong>All payments are non-refundable.</strong> Subscriptions renew automatically each billing period unless canceled 
            prior to renewal. You may cancel your subscription at any time from your account settings, and you will retain access 
            to Pro features until the end of the current billing cycle.
          </p>
          <p>
            No refunds or credits will be issued for:
          </p>
          <ul>
            <li>Partial billing periods</li>
            <li>Unused AI features or usage limits</li>
            <li>Subscription downgrades from Pro to Free</li>
            <li>Account deletions or suspensions</li>
          </ul>
          <p>
            <strong>Cancellation Process:</strong> You may cancel your Pro subscription anytime from your Account → Subscription page. 
            Upon cancellation, you will not be charged for subsequent billing periods, but your access will continue until the end of 
            the current paid period.
          </p>
          
          <h2>8. Code Sharing</h2>
          <p>
            When you share code using our sharing feature, you understand that:
          </p>
          <ul>
            <li>Shared code is accessible to anyone with the link</li>
            <li>Free users can share code with 30-day expiration</li>
            <li>Pro users can share code with up to 365-day expiration</li>
            <li>You are responsible for not sharing sensitive or confidential information</li>
          </ul>
          
          <h2>9. Prohibited Uses</h2>
          <p>
            You may not use OpenIDE to:
          </p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit malicious code or viruses</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Use automated systems to access the service excessively</li>
          </ul>
          
          <h2>10. Service Modifications</h2>
          <p>
            We reserve the right to modify or discontinue the service at any time, with or without notice. We will not be liable 
            to you or any third party for any modification, suspension, or discontinuance of the service.
          </p>
          
          <h2>11. Limitation of Liability</h2>
          <p>
            OpenIDE is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of 
            the service, including but not limited to loss of data, loss of profits, or service interruptions.
          </p>
          
          <h2>12. Privacy</h2>
          <p>
            Your use of OpenIDE is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
          </p>
          
          <h2>13. Changes to Terms</h2>
          <p>
            We may update these Terms of Service from time to time. We will notify you of any changes by posting the new Terms on this page 
            and updating the "Last updated" date.
          </p>
          
          <h2>14. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us through the feedback form on our website.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
