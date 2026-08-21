import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { updatePageSEO, SEO_CONFIGS } from "@/utils/seo";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Code2,
  Database,
  FileCode,
  FileText,
  Home,
  Package,
  Share2,
  Smartphone,
  Sparkles,
  Terminal,
  Upload,
} from "lucide-react";

const features = [
  {
    category: "Core workspace",
    description: "The things bIDE keeps in the foreground.",
    icon: <Terminal className="w-6 h-6" />,
    items: [
      {
        title: "Browser code execution",
        description: "Run Python, R, JavaScript, and SQL from the browser workspace without installing a local toolchain.",
        icon: <Code2 className="w-5 h-5" />,
      },
      {
        title: "Monaco editor",
        description: "Use a familiar code editor with files, syntax highlighting, keyboard workflows, and language-aware editing.",
        icon: <FileCode className="w-5 h-5" />,
      },
      {
        title: "Files + output",
        description: "Keep code files, run output, downloads, and session work together instead of bouncing between separate tools.",
        icon: <FileText className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "Data work",
    description: "Useful data tools without turning the IDE into a dashboard of widgets.",
    icon: <Database className="w-6 h-6" />,
    items: [
      {
        title: "CSV workspace",
        description: "Upload CSV data and use it from Python, R, SQL, or the built-in data workspace.",
        icon: <Upload className="w-5 h-5" />,
      },
      {
        title: "Data operations",
        description: "Filter, sort, group, and transform data with guided operations when you do not want to write every step by hand.",
        icon: <Database className="w-5 h-5" />,
      },
      {
        title: "Plot tools",
        description: "Build or inspect charts when the task needs a visual, while keeping plotting out of the main coding path by default.",
        icon: <BarChart3 className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "Tools on demand",
    description: "Secondary capabilities stay available without crowding the editor.",
    icon: <Package className="w-6 h-6" />,
    items: [
      {
        title: "Packages",
        description: "Load supported Python packages and runtime dependencies from the tools panel when the project needs them.",
        icon: <Package className="w-5 h-5" />,
      },
      {
        title: "Notebook mode",
        description: "Switch to a cell-based workflow for code, notes, and outputs when a notebook is a better fit than a normal file.",
        icon: <BookOpen className="w-5 h-5" />,
      },
      {
        title: "Templates + sharing",
        description: "Start from reusable examples or share code without making templates and collaboration permanent toolbar clutter.",
        icon: <Share2 className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "Optional Code Assist",
    description: "Bring your own key. Nothing runs in the background.",
    icon: <Sparkles className="w-6 h-6" />,
    items: [
      {
        title: "Ask",
        description: "Ask a focused question about the code already in your editor using your own Gemini API key.",
        icon: <Sparkles className="w-5 h-5" />,
      },
      {
        title: "Review",
        description: "Request a concise code review for real bugs, correctness risks, and high-value improvements.",
        icon: <Code2 className="w-5 h-5" />,
      },
      {
        title: "Complete",
        description: "Generate a proposed code completion, then choose whether to apply it. bIDE never silently rewrites the editor.",
        icon: <FileCode className="w-5 h-5" />,
      },
    ],
  },
  {
    category: "Browser + mobile",
    description: "The same workspace adapts to the device you have with you.",
    icon: <Smartphone className="w-6 h-6" />,
    items: [
      {
        title: "Responsive workspace",
        description: "Desktop keeps files, editor, and output visible; mobile condenses those surfaces into focused drawers and sheets.",
        icon: <Smartphone className="w-5 h-5" />,
      },
      {
        title: "PWA support",
        description: "Install the web app to supported devices for an app-like launch experience while keeping one web codebase.",
        icon: <FileCode className="w-5 h-5" />,
      },
    ],
  },
];

const Features = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.features);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://bideide.com/" },
        { name: "Features", url: "https://bideide.com/features" },
      ]} />

      <header className="border-b border-border/70 bg-background/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><Home className="w-5 h-5" /></Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">bIDE features</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Editor first. Secondary tools stay secondary.</p>
            </div>
          </div>
          <Button onClick={() => navigate("/ide")} className="gap-2 shrink-0">Open IDE <ChevronRight className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-14 max-w-6xl">
        <section className="max-w-3xl mb-14">
          <Badge variant="secondary" className="mb-4">Focused browser workspace</Badge>
          <h2 className="text-4xl md:text-6xl font-black tracking-[-0.045em] leading-[1.02]">Enough tools to work. Not enough clutter to get lost.</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            bIDE keeps execution, editing, files, and output in the main path. Data utilities, packages, notebooks, templates, sharing, and optional Code Assist are there when a task needs them.
          </p>
        </section>

        <div className="space-y-12">
          {features.map((category, index) => (
            <section key={category.category} id={category.category.toLowerCase().replace(/\s+/g, "-")}>
              <div className="flex items-start gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">{category.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold">{category.category}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {category.items.map((item) => (
                  <Card key={item.title} className="p-5 border-border/70 bg-card/40">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">{item.icon}</div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </Card>
                ))}
              </div>

              {index < features.length - 1 && <Separator className="mt-12" />}
            </section>
          ))}
        </div>

        <Card className="mt-16 p-7 sm:p-10 border-primary/20 bg-primary/5 grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <h3 className="text-2xl font-bold">Open the editor and start with the code.</h3>
            <p className="mt-2 text-muted-foreground">No AI key is required. Add one only if you choose to use Code Assist.</p>
          </div>
          <Button onClick={() => navigate("/ide")} size="lg"><Terminal className="w-4 h-4 mr-2" />Launch bIDE</Button>
        </Card>
      </main>

      <footer className="border-t border-border/70 py-8">
        <div className="container mx-auto px-4 flex flex-wrap gap-4 items-center justify-between text-sm text-muted-foreground">
          <p>bIDE by CodeMix · browser coding workspace</p>
          <div className="flex gap-4">
            <button onClick={() => navigate("/docs")} className="hover:text-foreground">Docs</button>
            <button onClick={() => navigate("/support")} className="hover:text-foreground">Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Features;
