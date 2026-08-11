import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Code2, Zap, Globe, Cpu, ArrowRight, Terminal, Sparkles, BookOpen, Wrench, User, LogIn, CloudOff, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AIUsageIndicator } from "@/components/AIUsageIndicator";
import { ActivityStats } from "@/components/ActivityStats";
import { RecentActivityFeed } from "@/components/RecentActivityFeed";
import { updatePageSEO, SEO_CONFIGS } from "@/utils/seo";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Landing = () => {
  const navigate = useNavigate();
  const { user, profile, isGuest, signOut } = useAuth();
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);
  const localMode = !isSupabaseConfigured;

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.landing);
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      toast({ title: "Signed out", description: "Successfully logged out" });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/30 overflow-hidden relative">
      <nav className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 flex items-center justify-between gap-3">
        <a
          href="https://pocketbi.app"
          className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <span className="font-semibold text-foreground">bIDE</span>
          <span className="hidden sm:inline">· a PocketBI product</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <div className="flex items-center gap-2">
          {localMode ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-primary/30 bg-primary/5 text-xs sm:text-sm text-primary font-medium">
              <CloudOff className="h-4 w-4" />
              Local Mode
            </div>
          ) : (
            <>
              <div className="hidden sm:block"><AIUsageIndicator /></div>
              {isGuest ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate("/auth?mode=login")}>
                    <LogIn className="h-4 w-4 mr-1" /> Login
                  </Button>
                  <Button size="sm" onClick={() => navigate("/auth?mode=signup")}>Sign Up</Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar><AvatarFallback>{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback></Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/account")}><User className="mr-2 h-4 w-4" />Account</DropdownMenuItem>
                    {profile?.subscription_tier !== "pro" && (
                      <DropdownMenuItem onClick={() => navigate("/upgrade")}><Zap className="mr-2 h-4 w-4" />Upgrade</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>{signingOut ? "Signing out..." : "Sign Out"}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>
      </nav>

      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(280_50%_25%/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(280_50%_25%/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-24">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
            {localMode ? <CloudOff className="w-4 h-4 text-primary" /> : <Sparkles className="w-4 h-4 text-primary" />}
            <span className="text-sm text-primary font-semibold">
              {localMode ? "Local-first browser IDE · no account required" : "Browser-Based IDE"}
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-neon-flicker">bIDE</h1>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto mb-8">
            Code and analyze data directly in your browser.
            <br />
            <span className="text-primary">Python, R, JavaScript, SQL, notebooks, and data tools.</span>
          </p>

          {localMode && (
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8">
              Cloud accounts, AI services, sharing, and payments are currently disabled. Core browser execution and local project workflows remain available.
            </p>
          )}

          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate("/ide")} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-lg px-8 py-6 rounded-full group">
              Launch IDE <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/features")} className="text-lg px-8 py-6 rounded-full group">
              <Wrench className="mr-2 w-5 h-5" /> Explore Features
            </Button>
          </div>
        </div>

        {!localMode && <ActivityStats />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full mt-16 animate-slide-up">
          <FeatureCard icon={<Terminal className="w-8 h-8" />} title="Local Execution" description="Run supported languages in the browser with WebAssembly-based runtimes." />
          <FeatureCard icon={<Code2 className="w-8 h-8" />} title="Smart Editor" description="Monaco-powered editing with syntax highlighting and developer-friendly tooling." />
          <FeatureCard icon={<Zap className="w-8 h-8" />} title="Data Tools" description="Work with datasets, plots, notebooks, templates, and data-oriented workflows." />
          <FeatureCard icon={<Globe className="w-8 h-8" />} title="Cross-Platform" description="Use bIDE from a modern desktop, tablet, or mobile browser." />
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-2xl font-semibold mb-6 text-foreground/90">Core browser stack</h2>
          <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
            <TechBadge icon={<Cpu className="w-5 h-5" />} name="Pyodide" />
            <TechBadge icon={<Cpu className="w-5 h-5" />} name="webR" />
            <TechBadge icon={<Code2 className="w-5 h-5" />} name="Monaco Editor" />
            <TechBadge icon={<Zap className="w-5 h-5" />} name="React" />
          </div>
        </div>

        {!localMode && <RecentActivityFeed />}

        <div className="mt-20 text-center">
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            <Button variant="ghost" onClick={() => navigate("/features")}>Features</Button>
            <Button variant="ghost" onClick={() => navigate("/tutorials")}><BookOpen className="w-4 h-4 mr-2" />Tutorials</Button>
            <Button variant="ghost" onClick={() => navigate("/support")}>Support</Button>
            <Button variant="ghost" onClick={() => navigate("/privacy")}>Privacy</Button>
            <Button variant="ghost" onClick={() => navigate("/ide")}>Launch IDE</Button>
          </div>
          <p className="text-muted-foreground text-sm">
            bIDE is a PocketBI product · Support: <a className="underline" href="mailto:support@proairesume.com">support@proairesume.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps { icon: React.ReactNode; title: string; description: string; }
const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="group relative p-6 rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
    <div className="relative z-10"><div className="mb-4 text-primary">{icon}</div><h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3><p className="text-sm text-muted-foreground">{description}</p></div>
  </div>
);

interface TechBadgeProps { icon: React.ReactNode; name: string; }
const TechBadge = ({ icon, name }: TechBadgeProps) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/30 backdrop-blur-sm">{icon}<span className="font-medium">{name}</span></div>
);

export default Landing;
