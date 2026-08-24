import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { beginPocketBIOAuth, isPocketBIOAuthConfigured, markDirectPocketBISession } from '@/integrations/pocketbi/oauth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Code2, Loader2, ShieldCheck } from 'lucide-react';
import { updatePageSEO, SEO_CONFIGS } from '@/utils/seo';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(requestedMode);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.auth);

    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (metaRobots) metaRobots.setAttribute('content', 'index, follow');
    };
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/ide', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const clearPasswords = () => {
    setPassword('');
    setConfirmPassword('');
  };

  const changeTab = (value: string) => {
    setActiveTab(value === 'signup' ? 'signup' : 'login');
    clearPasswords();
  };

  const handlePocketBIConnect = async () => {
    if (!isPocketBIOAuthConfigured()) {
      toast({
        title: 'PocketBI connection is not enabled yet',
        description: 'This deployment is missing its PocketBI OAuth configuration. You can still use the password fallback or continue as a guest.',
      });
      return;
    }

    setOauthLoading(true);
    try {
      await beginPocketBIOAuth('/ide');
    } catch (error: any) {
      setOauthLoading(false);
      toast({
        title: 'PocketBI connection could not start',
        description: error?.message || 'Try again or use the email/password fallback.',
        variant: 'destructive',
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await markDirectPocketBISession();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      toast({
        title: 'Welcome back',
        description: 'Your PocketBI ID is signed in to bIDE.',
      });
      clearPasswords();
      navigate('/ide');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Enter the same password twice before creating your PocketBI ID.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await markDirectPocketBISession();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/ide`,
        },
      });

      if (error) throw error;

      clearPasswords();

      if (data.session) {
        toast({
          title: 'PocketBI ID created',
          description: 'Your account is ready and signed in to bIDE.',
        });
        navigate('/ide');
      } else {
        toast({
          title: 'Check your email',
          description: 'Your PocketBI ID was created. Confirm the email if requested, then sign in here.',
        });
        setActiveTab('login');
      }
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message || 'Could not create PocketBI ID',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    navigate('/ide');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col justify-center gap-3">
        <Button
          variant="ghost"
          className="w-fit px-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/')}
          disabled={loading || oauthLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to bIDE
        </Button>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Code2 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">PocketBI ID for bIDE</CardTitle>
            <CardDescription>
              Use one PocketBI ID across bIDE and the PocketBI ecosystem, or keep coding locally as a guest.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3 mb-5">
              <Button className="w-full" onClick={handlePocketBIConnect} disabled={loading || oauthLoading}>
                {oauthLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening PocketBI…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Continue with PocketBI ID
                  </>
                )}
              </Button>
              <p className="text-xs text-center leading-5 text-muted-foreground">
                Recommended. Sign in or create your PocketBI ID on PocketBI, approve bIDE once, then return here securely.
              </p>
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>or use password here</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" disabled={loading || oauthLoading}>Sign In</TabsTrigger>
                <TabsTrigger value="signup" disabled={loading || oauthLoading}>Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      disabled={loading || oauthLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      disabled={loading || oauthLoading}
                    />
                  </div>
                  <Button type="submit" variant="outline" className="w-full" disabled={loading || oauthLoading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in with email & password
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      required
                      disabled={loading || oauthLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      disabled={loading || oauthLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      disabled={loading || oauthLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      disabled={loading || oauthLoading}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    <p className="mb-2">By creating a PocketBI ID, you agree to our:</p>
                    <div className="flex gap-2">
                      <Link to="/terms" target="_blank" className="underline hover:text-primary">
                        Terms of Service
                      </Link>
                      <span>•</span>
                      <Link to="/privacy" target="_blank" className="underline hover:text-primary">
                        Privacy Policy
                      </Link>
                    </div>
                  </div>
                  <Button type="submit" variant="outline" className="w-full" disabled={loading || oauthLoading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create PocketBI ID here
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Button variant="ghost" className="w-full" onClick={handleGuestContinue} disabled={loading || oauthLoading}>
              Continue as Guest
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              bIDE is a browser coding and data workspace across PocketBI-supported runtimes.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
