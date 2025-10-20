import { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft, Crown, Loader2, LogOut, Sparkles, Trash2, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { updatePageSEO, SEO_CONFIGS } from '@/utils/seo';
import { supabase } from '@/integrations/supabase/client';

const Account = () => {
  const { user, profile, aiUsage, signOut, isLoading } = useAuth();
  const [canceling, setCanceling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.account);
    
    // Check for success parameter from Stripe redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: 'Welcome to Pro! 🎉',
        description: 'Your subscription is active. Refreshing your account...',
      });
      
      // Refresh subscription status after a brief delay
      setTimeout(() => {
        window.location.href = '/account';
      }, 2000);
    }
    
    // Add noindex meta tag to prevent indexing of account pages
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'noindex, nofollow');
    
    return () => {
      // Clean up - restore default robots behavior
      if (metaRobots) {
        metaRobots.setAttribute('content', 'index, follow');
      }
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user && !isLoading) {
    return <Navigate to="/auth" replace />;
  }
  
  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'Successfully logged out',
      });
      navigate('/');
    } catch (error: any) {
      console.error('[ACCOUNT] Sign out error:', error);
      toast({
        title: 'Sign out failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSigningOut(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your Pro plan? You\'ll keep access until the end of this billing period.')) {
      return;
    }
    
    setCanceling(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        method: 'POST',
      });
      
      if (error) throw error;
      
      toast({
        title: 'Subscription canceled',
        description: `You'll keep Pro access until ${profile?.subscription_period_end ? format(new Date(profile.subscription_period_end), 'PP') : 'the end of your billing period'}.`,
      });
      
      // Refresh the page to update subscription status
      window.location.reload();
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      toast({
        title: 'Cancellation failed',
        description: error.message || 'Unable to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCanceling(false);
    }
  };
  
  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    try {
      // First try to sync from Stripe
      const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-subscription');
      if (syncError) {
        console.error('Sync error:', syncError);
      } else if (syncData) {
        console.log('Sync result:', syncData);
      }
      
      // Then check subscription status
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      toast({
        title: 'Subscription refreshed',
        description: syncData?.message || 'Your subscription status has been updated.',
      });
      
      // Reload to update profile
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Refresh subscription error:', error);
      toast({
        title: 'Refresh failed',
        description: 'Unable to refresh subscription status.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleReactivateSubscription = async () => {
    setReactivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('reactivate-subscription');
      if (error) throw error;
      
      toast({
        title: 'Subscription reactivated! 🎉',
        description: 'Your Pro subscription has been reactivated.',
      });
      
      // Reload to update profile
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Reactivate subscription error:', error);
      toast({
        title: 'Reactivation failed',
        description: error.message || 'Unable to reactivate subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReactivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });
      
      // Sign out and redirect to home
      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({
        title: 'Deletion failed',
        description: error.message || 'Unable to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
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
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRefreshSubscription} 
                    variant="outline" 
                    size="sm"
                    disabled={refreshing}
                  >
                    {refreshing && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    Refresh
                  </Button>
                  {!isPro && (
                    <Button onClick={() => navigate('/upgrade')} size="sm">
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
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
                {isPro ? 'Unlimited AI usage' : `${aiUsage?.limit || 3} AI uses every 5 days`}
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
                      {isPro ? '∞' : aiUsage?.limit || 3}
                    </p>
                    <p className="text-sm text-muted-foreground">5-Day Limit</p>
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
                    <p className="font-bold">Pro • $9.99/month</p>
                  </div>
                  <Badge variant="secondary">
                    {profile.subscription_status === 'active' ? 'Active' : profile.subscription_status}
                  </Badge>
                </div>
                
                {profile.cancel_at_period_end ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Subscription Canceled</AlertTitle>
                    <AlertDescription className="space-y-3">
                      {profile.canceled_at && (
                        <p className="mb-2">
                          Canceled on {format(new Date(profile.canceled_at), 'PPP')} at {format(new Date(profile.canceled_at), 'p')}
                        </p>
                      )}
                      <p>
                        Your Pro access will remain active until{' '}
                        {profile.subscription_period_end && format(new Date(profile.subscription_period_end), 'PPP')}.
                      </p>
                      <Button 
                        variant="default" 
                        onClick={handleReactivateSubscription}
                        disabled={reactivating}
                        className="mt-3"
                      >
                        {reactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reactivate Subscription
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Click to keep your Pro subscription active
                      </p>
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
          
          {/* Sign Out & Delete Account */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Delete Account Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-destructive">
                This action cannot be undone. This will permanently:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Delete your account and profile</li>
                <li>Remove all your data from our database</li>
                <li>Cancel any active subscriptions</li>
                <li>Delete your email from our system</li>
                <li>Remove all your saved code and projects</li>
              </ul>
              <p className="font-semibold mt-4">
                Are you absolutely sure you want to delete your account?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Account;
