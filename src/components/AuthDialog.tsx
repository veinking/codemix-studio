import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PocketBIConnectSection } from "@/components/PocketBIConnectSection";
import { supabase } from "@/integrations/supabase/client";
import { markDirectPocketBISession } from "@/integrations/pocketbi/oauth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "reset">("login");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const clearPasswords = () => {
    setPassword("");
    setConfirmPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await markDirectPocketBISession();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back",
        description: "Your PocketBI ID is signed in to bIDE.",
      });

      onOpenChange(false);
      setEmail("");
      clearPasswords();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Enter the same password twice before creating your PocketBI ID.",
      });
      return;
    }

    setIsLoading(true);

    try {
      await markDirectPocketBISession();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/ide`,
        },
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: "PocketBI ID created",
          description: "You're signed in and can continue in bIDE.",
        });
        onOpenChange(false);
        setEmail("");
      } else {
        toast({
          title: "Check your email",
          description: "Your PocketBI ID was created. Confirm the email if requested, then sign in here.",
        });
        setActiveTab("login");
      }
      clearPasswords();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message || "Could not create PocketBI ID",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/ide`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link. Click it to set a new password.",
      });

      setActiveTab("login");
      setEmail("");
      clearPasswords();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: error.message || "Could not send reset email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    onOpenChange(false);
    toast({
      title: "Continuing as guest",
      description: "You can connect PocketBI ID later when you want account-backed features.",
    });
  };

  const changeTab = (value: string) => {
    setActiveTab(value as "login" | "signup" | "reset");
    clearPasswords();
  };

  const authForm = (
    <>
      {activeTab !== "reset" && (
        <PocketBIConnectSection disabled={isLoading} onBusyChange={setOauthLoading} />
      )}
      <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login" disabled={isLoading || oauthLoading}>Sign In</TabsTrigger>
          <TabsTrigger value="signup" disabled={isLoading || oauthLoading}>Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required disabled={isLoading || oauthLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required disabled={isLoading || oauthLoading} />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={isLoading || oauthLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign in with email & password"}
            </Button>
            <Button type="button" variant="link" size="sm" onClick={() => changeTab("reset")} disabled={isLoading || oauthLoading} className="text-xs text-muted-foreground hover:text-primary">
              Forgot password?
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required disabled={isLoading || oauthLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required disabled={isLoading || oauthLoading} minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirm password</Label>
              <Input id="signup-confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required disabled={isLoading || oauthLoading} minLength={8} />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={isLoading || oauthLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : "Create PocketBI ID here"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="reset" className="space-y-4">
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input id="reset-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending reset link...</> : "Send Reset Link"}
            </Button>
            <Button type="button" variant="link" size="sm" onClick={() => changeTab("login")} disabled={isLoading} className="w-full text-xs text-muted-foreground hover:text-primary">
              Back to sign in
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </>
  );

  const footer = (
    <div className="mt-4 pt-4 border-t border-border">
      <Button variant="ghost" className="w-full" onClick={handleContinueAsGuest} disabled={isLoading || oauthLoading}>
        Continue as Guest
      </Button>
    </div>
  );

  const title = activeTab === "reset" ? "Reset Password" : "PocketBI ID for bIDE";
  const description = activeTab === "reset"
    ? "Enter your email to receive a password reset link"
    : "Use one PocketBI ID across bIDE and PocketBI, use the password fallback, or keep coding as a guest.";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>{title}</DrawerTitle><DrawerDescription>{description}</DrawerDescription></DrawerHeader>
          <div className="px-4 pb-8">{authForm}{activeTab !== "reset" && footer}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        {authForm}
        {activeTab !== "reset" && footer}
      </DialogContent>
    </Dialog>
  );
};
