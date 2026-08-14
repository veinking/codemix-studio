import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle2, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { updatePageSEO, SEO_CONFIGS } from '@/utils/seo';

const Upgrade = () => {
  const { isGuest, hasCapability, entitlementError } = useAuth();
  const navigate = useNavigate();
  const isPro = hasCapability('bide.pro');

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.upgrade);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container max-w-6xl py-12">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-12">
          <Badge className="mb-4 text-base px-4 py-1">
            <Crown className="h-4 w-4 mr-2" />
            PocketBI membership
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            One membership. More capable tools.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            bIDE uses your shared PocketBI entitlement instead of maintaining a separate local subscription flag.
          </p>
        </div>

        {entitlementError && (
          <Alert className="mb-8 max-w-3xl mx-auto">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Membership status unavailable</AlertTitle>
            <AlertDescription>
              bIDE could not verify PocketBI access right now. Pro-only capabilities remain locked until verification succeeds.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Guest</CardTitle>
              <CardDescription>Open the workspace immediately</CardDescription>
              <div className="mt-4"><span className="text-3xl font-bold">Free</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <Feature>Core IDE access</Feature>
                <Feature>Python, R, JavaScript, and SQL workspace</Feature>
                <Feature>Local-first code storage</Feature>
                <Feature>Cloud/account features stay off</Feature>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PocketBI Free</CardTitle>
              <CardDescription>For signed-in PocketBI users</CardDescription>
              <div className="mt-4"><span className="text-3xl font-bold">Free</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <Feature>Everything in Guest</Feature>
                <Feature>Shared PocketBI ID</Feature>
                <Feature>Free-tier AI allowance when available</Feature>
                <Feature>Account-backed activity and cloud features</Feature>
              </ul>
              {isGuest && (
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/auth?mode=signup')}>
                  Create PocketBI ID
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">Shared entitlement</Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                PocketBI Pro
                <Crown className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>Pro access follows your PocketBI ID</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <Feature>Everything in PocketBI Free</Feature>
                <Feature>Capability-gated bIDE Pro features</Feature>
                <Feature>Higher AI allowance when enabled</Feature>
                <Feature>Priority product capabilities as the ecosystem expands</Feature>
              </ul>
              {isPro ? (
                <div className="mt-4 text-center">
                  <Badge variant="secondary" className="text-sm">
                    <Crown className="h-3 w-3 mr-1" />
                    Pro access verified
                  </Badge>
                </div>
              ) : (
                <Alert className="mt-4">
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Unified billing is being finalized</AlertTitle>
                  <AlertDescription>
                    bIDE no longer opens its old standalone Stripe checkout. This prevents a broken or duplicate subscription while PocketBI billing is consolidated.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="p-8 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Your PocketBI ID is the source of access.</h2>
          <p className="text-muted-foreground mb-6">
            Payment providers can change without forcing every PocketBI product to build its own membership system.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button onClick={() => navigate(isGuest ? '/auth?mode=signup' : '/account')}>
              {isGuest ? 'Create PocketBI ID' : 'View account'}
            </Button>
            <Button variant="outline" asChild>
              <a href="https://pocketbi.app" target="_blank" rel="noreferrer">Visit PocketBI</a>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            <Link to="/terms" className="underline hover:text-primary">Terms</Link>
            {' · '}
            <Link to="/privacy" className="underline hover:text-primary">Privacy</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export default Upgrade;
