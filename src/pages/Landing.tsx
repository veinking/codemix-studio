import { Button } from "@/components/ui/button";
import { Code2, Zap, Globe, Cpu, ArrowRight, Terminal, Sparkles, BookOpen, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActivityStats } from "@/components/ActivityStats";
import { RecentActivityFeed } from "@/components/RecentActivityFeed";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/30 overflow-hidden relative">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(280_50%_25%/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(280_50%_25%/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Glow orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-semibold">Browser-Based IDE</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-neon-flicker">
            OpenIDE
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto mb-8">
            Code Python & R directly in your browser.
            <br />
            <span className="text-primary">No installation. No limits. Pure power.</span>
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={() => navigate("/ide")}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-primary/50 transition-all duration-300 animate-glow-pulse group"
            >
              Launch IDE
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/features")}
              className="text-lg px-8 py-6 rounded-full group"
            >
              <Wrench className="mr-2 w-5 h-5" />
              Explore Features
            </Button>
          </div>
        </div>

        {/* Activity Stats Banner */}
        <ActivityStats />

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full mt-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <FeatureCard
            icon={<Terminal className="w-8 h-8" />}
            title="Instant Execution"
            description="Run Python & R code with WebAssembly - no backend required"
          />
          <FeatureCard
            icon={<Code2 className="w-8 h-8" />}
            title="Smart Editor"
            description="Monaco-powered with autocomplete, syntax highlighting & IntelliSense"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Scratch Mode"
            description="Start coding instantly without creating files - session persistence"
          />
          <FeatureCard
            icon={<Globe className="w-8 h-8" />}
            title="Cross-Platform"
            description="Works everywhere - desktop, tablet, or mobile browser"
          />
        </div>

        {/* Tech Stack */}
        <div className="mt-20 text-center animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-2xl font-semibold mb-6 text-foreground/90">
            Powered By
          </h2>
          <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
            <TechBadge icon={<Cpu className="w-5 h-5" />} name="Pyodide" />
            <TechBadge icon={<Cpu className="w-5 h-5" />} name="webR" />
            <TechBadge icon={<Code2 className="w-5 h-5" />} name="Monaco Editor" />
            <TechBadge icon={<Zap className="w-5 h-5" />} name="React" />
          </div>
        </div>

        {/* Recent Activity Feed */}
        <RecentActivityFeed />

        {/* Footer */}
        <div className="mt-20 text-center">
          <div className="flex justify-center gap-6 mb-6">
            <Button variant="ghost" onClick={() => navigate("/features")}>
              Features
            </Button>
            <Button variant="ghost" onClick={() => navigate("/tutorials")}>
              <BookOpen className="w-4 h-4 mr-2" />
              Tutorials
            </Button>
            <Button variant="ghost" onClick={() => navigate("/ide")}>
              Launch IDE
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Built by a student, for students • Free forever • Code anywhere
          </p>
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="group relative p-6 rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="mb-4 text-primary">{icon}</div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

interface TechBadgeProps {
  icon: React.ReactNode;
  name: string;
}

const TechBadge = ({ icon, name }: TechBadgeProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/30 backdrop-blur-sm hover:border-primary/50 hover:text-primary transition-all duration-300">
      {icon}
      <span className="font-medium">{name}</span>
    </div>
  );
};

export default Landing;
