import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Code2, Cpu, Database, FileCode, LogIn, MoreHorizontal, Package, Sparkles, Terminal, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { updatePageSEO, SEO_CONFIGS } from "@/utils/seo";
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
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.landing);
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_-8%,hsl(var(--primary)/0.14),transparent_32rem),radial-gradient(circle_at_92%_4%,hsl(var(--accent)/0.08),transparent_28rem)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.16)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.16)_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:linear-gradient(to_bottom,#000,transparent_70%)]" />

      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 text-left" aria-label="bIDE home">
          <span className="w-9 h-9 rounded-xl border border-primary/25 bg-primary/10 grid place-items-center font-black text-primary">b</span>
          <span>
            <strong className="block text-sm leading-none">bIDE</strong>
            <small className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Browser IDE</small>
          </span>
        </button>

        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/features")}>Features</Button>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/docs")}>Docs</Button>
          {isGuest ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth?mode=login")}><LogIn className="w-4 h-4 mr-1.5" />Sign in</Button>
              <Button size="sm" onClick={() => navigate("/ide")}>Open IDE</Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8"><AvatarFallback>{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback></Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/account")}><User className="mr-2 h-4 w-4" />Account</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/ide")}><Code2 className="mr-2 h-4 w-4" />Open IDE</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleSignOut()} disabled={signingOut}><LogIn className="mr-2 h-4 w-4" />{signingOut ? "Signing out…" : "Sign out"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </header>

      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-24 pb-20">
        <section className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-card/45 text-xs font-semibold text-muted-foreground">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            Code first. Tools when you need them.
          </div>
          <h1 className="mt-7 text-5xl sm:text-7xl md:text-8xl font-black tracking-[-0.065em] leading-[0.93]">
            A focused coding workspace in your browser.
          </h1>
          <p className="mt-7 max-w-2xl text-lg sm:text-xl leading-8 text-muted-foreground">
            Run Python, R, JavaScript, and SQL without a local setup. Keep files, datasets, output, packages, and optional notebook tools in one editor-first workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate("/ide")} className="group px-7">
              Open bIDE <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/features")} className="px-7">
              See what’s included
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Optional Code Assist is bring-your-own-key. bIDE does not require AI to run code.
          </p>
        </section>

        <section className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CoreCard icon={<Terminal className="w-5 h-5" />} title="Browser runtimes" description="Execute Python, R, JavaScript, and SQL directly from the workspace." />
          <CoreCard icon={<FileCode className="w-5 h-5" />} title="Monaco editor" description="Files, syntax highlighting, keyboard workflows, and a real code-editor feel." />
          <CoreCard icon={<Database className="w-5 h-5" />} title="Data ready" description="Bring in CSV data, inspect it, and work with it from the same coding session." />
          <CoreCard icon={<Package className="w-5 h-5" />} title="Tools on demand" description="Packages, templates, plotting, notebooks, and Code Assist stay secondary until needed." />
        </section>

        <section className="mt-16 rounded-3xl border border-border/70 bg-card/45 p-6 sm:p-8 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] font-bold text-primary">Optional assist</div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">AI is a tool, not the product.</h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base leading-7 text-muted-foreground">
              Add your own Gemini API key only when you want Ask, Review, or Complete. The key is session-scoped, there is no background code scan, and generated code is never applied without your action.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/features")}><Sparkles className="w-4 h-4 mr-2" />How Code Assist works</Button>
        </section>

        <section className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Built with</span>
          <span className="inline-flex items-center gap-1.5"><Cpu className="w-4 h-4" />Pyodide</span>
          <span className="inline-flex items-center gap-1.5"><Cpu className="w-4 h-4" />webR</span>
          <span className="inline-flex items-center gap-1.5"><Code2 className="w-4 h-4" />Monaco</span>
          <span className="inline-flex items-center gap-1.5"><MoreHorizontal className="w-4 h-4" />PWA</span>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-sm text-muted-foreground">
          <span>bIDE by CodeMix · browser coding workspace</span>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate("/docs")} className="hover:text-foreground"><BookOpen className="w-3.5 h-3.5 inline mr-1" />Docs</button>
            <button onClick={() => navigate("/support")} className="hover:text-foreground">Support</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground">Privacy</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

function CoreCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <article className="rounded-2xl border border-border/70 bg-card/35 p-5 hover:bg-card/55 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">{icon}</div>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

export default Landing;
