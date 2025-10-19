import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft, Crown, Loader2, LogOut, Sparkles, Zap } from 'lucide-react';
import { format } from 'date-fns';

const Account = () => {
  const { user, profile, aiUsage, signOut, isLoading } = useAuth();
  const [canceling, setCanceling] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    navigate('/auth');
    return null;
  }
  
  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'Successfully logged out',
    });
    navigate('/');
  };
  
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your Pro plan? You\'ll keep access until the end of this billing period.')) {
      return;
    }
    
    setCanceling(true);
    // TODO: Implement cancel subscription
    toast({
      title: 'Not implemented yet',
      description: 'Subscription cancellation will be available soon',
    });
    setCanceling(false);
  };
  
  const isPro = profile?.subscription_tier === 'pro';
  const isFreeTier = profile?.subscription_tier === 'free';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container max-w-4xl py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/ide')} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to IDE
        </Button>
        
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your profile and subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{profile?.full_name || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Current Plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold capitalize">{profile?.subscription_tier || 'Free'}</span>
                    {isPro && (
                      <Badge variant="secondary" className="gap-1">
                        <Crown className="h-3 w-3" />
                        PRO
                      </Badge>
                    )}
                  </div>
                </div>
                {!isPro && (
                  <Button onClick={() => navigate('/upgrade')} size="sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* AI Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Usage
              </CardTitle>
              <CardDescription>
                {isPro ? 'Unlimited AI usage' : `${aiUsage?.limit || 6} AI uses per day`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <p className="text-2xl font-bold">
                      {isPro ? '∞' : aiUsage?.used_today || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Used Today</p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <p className="text-2xl font-bold">
                      {isPro ? '∞' : aiUsage?.remaining || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <p className="text-2xl font-bold">
                      {isPro ? '∞' : aiUsage?.limit || 6}
                    </p>
                    <p className="text-sm text-muted-foreground">Daily Limit</p>
                  </div>
                </div>
                
                {!isPro && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Want unlimited AI?</AlertTitle>
                    <AlertDescription>
                      Upgrade to Pro for unlimited AI usage, priority processing, and more.
                      <Button 
                        variant="link" 
                        className="p-0 h-auto ml-1" 
                        onClick={() => navigate('/upgrade')}
                      >
                        Learn more →
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Subscription Management Card (Pro only) */}
          {isPro && profile && (
            <Card>
              <CardHeader>
                <CardTitle>Manage Subscription</CardTitle>
                <CardDescription>View and manage your Pro subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <p className="font-bold">Pro • $7.99/month</p>
                  </div>
                  <Badge variant="secondary">
                    {profile.subscription_status === 'active' ? 'Active' : profile.subscription_status}
                  </Badge>
                </div>
                
                {profile.cancel_at_period_end ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Subscription Canceling</AlertTitle>
                    <AlertDescription>
                      Your Pro access will end on{' '}
                      {profile.subscription_period_end && format(new Date(profile.subscription_period_end), 'PPP')}.
                      You can reactivate anytime before then.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div>
                    {profile.subscription_period_end && (
                      <p className="text-sm text-muted-foreground mb-4">
                        Next billing date:{' '}
                        {format(new Date(profile.subscription_period_end), 'PPP')}
                      </p>
                    )}
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelSubscription}
                      disabled={canceling}
                    >
                      {canceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cancel Subscription
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      You'll keep access until{' '}
                      {profile.subscription_period_end && format(new Date(profile.subscription_period_end), 'PP')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Sign Out */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;
