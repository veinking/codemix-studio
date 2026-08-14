import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Crown, Loader2, LogOut, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { updatePageSEO, SEO_CONFIGS } from '@/utils/seo';

const Account = () => {
  const {
    user,
    aiUsage,
    signOut,
    isLoading,
    entitlementError,
    hasCapability,
    refreshEntitlements,
  } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.account);
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', 'noindex, nofollow');
    return () => robots?.setAttribute('content', 'index, follow');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const isPro = hasCapability('bide.pro');
  const planLabel = entitlementError ? 'Access unavailable' : isPro ? 'PocketBI Pro' : 'PocketBI Free';

  async function refreshAccess() {
    setRefreshing(true);
    try {
      await refreshEntitlements();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container max-w-4xl py-12">
        <Button variant="ghost" onClick={() => navigate('/ide')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to IDE
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your PocketBI identity and bIDE access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">{user.email?.charAt(0).toUpperCase() || 'P'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">PocketBI ID</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
                  {signingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                  Sign out
                </Button>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Membership</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold">{planLabel}</span>
                    {isPro && !entitlementError && (
                      <Badge variant="secondary" className="gap-1">
                        <Crown className="h-3 w-3" /> PRO
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={refreshAccess} disabled={refreshing}>
                    {refreshing ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                    Refresh access
                  </Button>
                  {!isPro && <Button size="sm" onClick={() => navigate('/upgrade')}>View membership</Button>}
                </div>
              </div>

              {entitlementError && (
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Could not verify PocketBI access</AlertTitle>
                  <AlertDescription>
                    Pro-only capabilities remain locked until the entitlement service responds successfully.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI usage
              </CardTitle>
              <CardDescription>
                Usage is enforced by the shared PocketBI backend rather than a client-side plan label.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Stat label="Used today" value={String(aiUsage?.used_today ?? 0)} />
                <Stat label="Remaining" value={String(aiUsage?.remaining ?? 0)} />
                <Stat label="Current limit" value={String(aiUsage?.limit ?? 0)} />
              </div>
              {aiUsage?.message && <p className="text-sm text-muted-foreground mt-4">{aiUsage.message}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membership management</CardTitle>
              <CardDescription>bIDE no longer maintains a separate subscription checkout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-6">
                Your bIDE access follows the capabilities attached to your PocketBI ID. This avoids duplicate billing and keeps payment providers separate from product authorization.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate('/upgrade')}>View access tiers</Button>
                <Button variant="outline" asChild>
                  <a href="https://pocketbi.app" target="_blank" rel="noreferrer">Open PocketBI</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy and account requests</CardTitle>
              <CardDescription>Need help with account access, data, or deletion?</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Contact the shared support inbox and include the email used for your PocketBI ID. Never send passwords or access tokens by email.
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:support@proairesume.com?subject=PocketBI%20Account%20Request">Contact support</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-4 bg-secondary rounded-lg">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default Account;
