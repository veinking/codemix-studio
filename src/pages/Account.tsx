import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Crown, ExternalLink, KeyRound, Loader2, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { updatePageSEO, SEO_CONFIGS } from '@/utils/seo';

const POCKETBI_ACCOUNT_HOME = 'https://pocketbi.app/account';

const Account = () => {
  const {
    user,
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
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) return <Navigate to="/auth" replace />;

  const isPro = hasCapability('bide.pro');
  const accessLabel = entitlementError ? 'Access unavailable' : isPro ? 'PocketBI Pro access' : 'Standard access';

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
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-10 sm:py-14 px-4">
        <Button variant="ghost" onClick={() => navigate('/ide')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to IDE
        </Button>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>PocketBI ID in bIDE</CardTitle>
              <CardDescription>Your shared PocketBI identity and this browser's bIDE session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="text-lg">{user.email?.charAt(0).toUpperCase() || 'P'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">Signed in to bIDE on this browser</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
                  {signingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                  Sign out of bIDE
                </Button>
              </div>

              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>One PocketBI ID, securely connected</AlertTitle>
                <AlertDescription>
                  Your PocketBI ID is the same account across the ecosystem. bIDE keeps its own local browser session, while PocketBI securely authorizes it with a one-time PKCE code. You should not need to type your password again when PocketBI is already signed in.
                </AlertDescription>
              </Alert>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Connected access</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold">{accessLabel}</span>
                    {isPro && !entitlementError && <Badge variant="secondary" className="gap-1"><Crown className="h-3 w-3" />PRO</Badge>}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={refreshAccess} disabled={refreshing}>
                  {refreshing ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                  Refresh access
                </Button>
              </div>

              {entitlementError && (
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Could not verify PocketBI access</AlertTitle>
                  <AlertDescription>Connected capabilities remain conservative until the entitlement service responds successfully.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PocketBI ecosystem</CardTitle>
              <CardDescription>Your central account home is the consistent place for access, products, billing, and Business features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-6">
                Use bIDE for code-first work. Use the PocketBI Account Home when you want to see the rest of the ecosystem or manage shared access. Product files are not automatically shared just because the account is shared.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild><a href={POCKETBI_ACCOUNT_HOME} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />PocketBI Account Home</a></Button>
                <Button variant="outline" asChild><a href="https://pocketbi.app/app" target="_blank" rel="noreferrer">Open PocketBI Workspace</a></Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />Code Assist</CardTitle>
              <CardDescription>AI is optional and bring-your-own-key.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-6">
              <p>bIDE does not sell or meter AI requests. Add your own Gemini API key from Code Assist when you choose to use Ask, Review, or Complete.</p>
              <p>The key is kept for the current browser session and can be forgotten from the assistant. Running code does not require an AI key.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy and account requests</CardTitle>
              <CardDescription>Need help with bIDE access, data, or account deletion?</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Never send passwords, API keys, or access tokens by email.</p>
              <Button variant="outline" asChild><a href="mailto:support@bideide.com?subject=bIDE%20Account%20Request">Contact bIDE support</a></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;
