import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { updatePageSEO, SEO_CONFIGS } from "@/utils/seo";
import {
  Code2, Zap, Brain, Database, FileCode, BarChart3, 
  Palette, Package, Globe, Sparkles, BookOpen, 
  ChevronRight, Home, Terminal, Lightbulb, FileText,
  Share2, Download, Upload, Layout, Smartphone, Monitor,
  CheckCircle2, Wrench
} from "lucide-react";

const Features = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.features);
  }, []);

  const features = [
    {
      category: "Code Execution",
      icon: <Terminal className="w-6 h-6" />,
      items: [
        {
          title: "Python & R Support",
          description: "Run Python and R code directly in your browser using WebAssembly (Pyodide & webR). No server required.",
          icon: <Code2 className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "JavaScript & SQL",
          description: "Execute JavaScript and SQL queries for web development and data manipulation.",
          icon: <FileCode className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "Package Manager",
          description: "Install Python packages (numpy, pandas, matplotlib, etc.) on-the-fly without leaving the IDE.",
          icon: <Package className="w-5 h-5" />,
          status: "live"
        }
      ]
    },
    {
      category: "AI-Powered Tools",
      icon: <Brain className="w-6 h-6" />,
      items: [
        {
          title: "AI Code Assistant",
          description: "Get code suggestions, auto-complete, scan for bugs, and optimize your code with AI.",
          icon: <Sparkles className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "Plain English Error Explanations",
          description: "Understand errors instantly with AI-powered explanations in simple language, including what happened, why, and how to fix it.",
          icon: <Lightbulb className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "Code Translation",
          description: "Convert code between Python, R, JavaScript, and SQL seamlessly.",
          icon: <Globe className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "Lab Trainer",
          description: "Generate programming challenges at different difficulty levels to practice your skills.",
          icon: <BookOpen className="w-5 h-5" />,
          status: "live"
        }
      ]
    },
    {
      category: "Data Science Tools",
      icon: <Database className="w-6 h-6" />,
      items: [
        {
          title: "CSV Upload & Analysis",
          description: "Upload CSV files, view them in a spreadsheet-like interface, and analyze with pandas/tidyverse.",
          icon: <Upload className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "DataLab",
          description: "Get AI-powered data cleaning recommendations and exploratory analysis suggestions.",
          icon: <Wrench className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "Data Operations",
          description: "Filter, sort, group, and transform data with point-and-click operations that generate code.",
          icon: <Database className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "ML Operations",
          description: "Build machine learning models with linear regression, logistic regression, and decision trees.",
          icon: <Brain className="w-5 h-5" />,
          status: "live"
        }
      ]
    },
    {
      category: "Visualization",
      icon: <BarChart3 className="w-6 h-6" />,
      items: [
        {
          title: "Plot Builder",
          description: "Create beautiful visualizations (scatter, line, bar, histogram) with an intuitive interface.",
          icon: <Palette className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "Plot Viewer",
          description: "View matplotlib/ggplot2 outputs directly in the IDE with download options.",
          icon: <BarChart3 className="w-5 h-5" />,
          status: "live"
        }
      ]
    },
    {
      category: "Productivity",
      icon: <Layout className="w-6 h-6" />,
      items: [
        {
          title: "Notebook Mode",
          description: "Jupyter-style notebook interface with markdown support for mixing code, visualizations, and notes.",
          icon: <FileText className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "File Management",
          description: "Create, organize, and manage multiple code files with a built-in file explorer.",
          icon: <FileCode className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "Code Templates",
          description: "Start quickly with pre-built templates for data analysis, plotting, and machine learning.",
          icon: <FileText className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "Share Code",
          description: "Generate shareable links to your code with optional expiration dates.",
          icon: <Share2 className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "Portfolio Export",
          description: "Export your projects as beautiful HTML portfolios to showcase your work.",
          icon: <Download className="w-5 h-5" />,
          status: "live"
        }
      ]
    },
    {
      category: "Cross-Platform",
      icon: <Smartphone className="w-6 h-6" />,
      items: [
        {
          title: "Responsive Design",
          description: "Optimized layouts for both desktop and mobile devices - code anywhere, anytime.",
          icon: <Monitor className="w-5 h-5" />,
          status: "live"
        },
        {
          title: "Offline Support",
          description: "Works offline once loaded. Your code is saved locally using IndexedDB.",
          icon: <Zap className="w-5 h-5" />,
          status: "live"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Features & Tools</h1>
                <p className="text-sm text-muted-foreground">Everything you need to code, analyze, and learn</p>
              </div>
            </div>
            <Button onClick={() => navigate("/ide")} size="lg" className="gap-2">
              Try It Now
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            25+ Powerful Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            A Complete IDE in Your Browser
          </h2>
          <p className="text-xl text-muted-foreground">
            From code execution to AI assistance, data analysis to visualization - 
            everything you need is built-in and ready to use.
          </p>
        </div>

        {/* Feature Categories */}
        <div className="space-y-12">
          {features.map((category, idx) => (
            <section key={idx} id={category.category.toLowerCase().replace(/\s+/g, '-')}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  {category.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{category.category}</h3>
                  <p className="text-sm text-muted-foreground">{category.items.length} features available</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map((item, itemIdx) => (
                  <Card key={itemIdx} className="p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-foreground">{item.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {idx < features.length - 1 && <Separator className="mt-12" />}
            </section>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="p-12 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <h3 className="text-3xl font-bold mb-4 text-foreground">Ready to Start Coding?</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              All these features are completely free and available now. 
              No signup required, no installation needed.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => navigate("/ide")} size="lg" className="gap-2">
                <Code2 className="w-5 h-5" />
                Launch IDE
              </Button>
              <Button onClick={() => navigate("/tutorials")} variant="outline" size="lg" className="gap-2">
                <BookOpen className="w-5 h-5" />
                View Tutorials
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>OpenIDE • Built by students, for students • Free forever</p>
        </div>
      </footer>
    </div>
  );
};

export default Features;
