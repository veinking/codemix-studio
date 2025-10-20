import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Crown, Zap, ArrowLeft } from 'lucide-react';
import { updatePageSEO, SEO_CONFIGS } from '@/utils/seo';

const Upgrade = () => {
  const { user, profile, isGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.upgrade);
  }, []);
  
  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth?mode=signup');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {}
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to start checkout. Please ensure Stripe is configured with a valid Pro plan price.');
    } finally {
      setLoading(false);
    }
  };
  
  const isPro = profile?.subscription_tier === 'pro';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container max-w-6xl py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 text-base px-4 py-1">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Unlimited AI. Unlimited Potential.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Never hit a daily limit again. Code smarter with AI by your side.
          </p>
        </div>
        
        {/* Pricing Comparison */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Guest */}
          <Card>
            <CardHeader>
              <CardTitle>Guest</CardTitle>
              <CardDescription>Try it out</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">Free</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>Full IDE access (Python, R, JS, SQL)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>Local code storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="font-bold">3 AI uses per day</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Free Account */}
          <Card>
            <CardHeader>
              <CardTitle>Free Account</CardTitle>
              <CardDescription>For regular users</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">Free</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Everything in Guest</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span className="font-bold">6 AI uses per day</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Code sharing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Progress tracking</span>
                </li>
              </ul>
              {isGuest && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  Sign Up Free
                </Button>
              )}
            </CardContent>
          </Card>
          
          {/* Pro */}
          <Card className="border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pro
                <Crown className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>For power users</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$7.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span className="font-bold">Unlimited AI usage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Priority AI processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Extended code sharing (365 days)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
              {!isPro && (
                <Button 
                  className="w-full mt-4"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {loading ? 'Processing...' : 'Upgrade Now'}
                </Button>
              )}
              {isPro && (
                <div className="mt-4 text-center">
                  <Badge variant="secondary" className="text-sm">
                    <Crown className="h-3 w-3 mr-1" />
                    Current Plan
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Checkout CTA */}
        {!isPro && (
          <Card className="p-8 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Ready to upgrade?</h2>
            <p className="text-muted-foreground mb-6">
              Start your Pro subscription today for just $7.99/month
            </p>
            <Button size="lg" onClick={handleCheckout} disabled={loading}>
              <Zap className="h-5 w-5 mr-2" />
              {loading ? 'Processing...' : 'Subscribe to Pro'}
            </Button>
            <div className="mt-6 text-sm text-muted-foreground space-y-2">
              <p>
                By subscribing, you agree to our{' '}
                <Link to="/terms" target="_blank" className="underline hover:text-primary">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" className="underline hover:text-primary">
                  Privacy Policy
                </Link>.
              </p>
              <p className="font-semibold text-foreground">
                No refunds. Cancel anytime from your account settings.
              </p>
              <p className="text-xs">
                You'll keep access until the end of your billing period after canceling.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Upgrade;
