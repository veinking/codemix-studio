import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { updatePageSEO, SEO_CONFIGS } from "@/utils/seo";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import {
  Home, BookOpen, Code2, Play, Lightbulb, Database,
  BarChart3, FileCode, Brain, ChevronRight, Terminal,
  Upload, Share2, Sparkles, Package
} from "lucide-react";

const Tutorials = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.tutorials);
  }, []);

  const tutorials = [
    {
      title: "Getting Started",
      icon: <Play className="w-5 h-5" />,
      level: "Beginner",
      duration: "5 min",
      topics: [
        {
          question: "How do I run my first code?",
          answer: `1. Launch the IDE from the homepage\n2. Choose your language (Python or R) from the selector\n3. Write your code in the editor\n4. Click the "Run" button or press Ctrl+Enter (Cmd+Enter on Mac)\n5. View your output in the console below\n\nExample Python code to try:\nprint("Hello, bIDE!")\nfor i in range(5):\n    print(f"Count: {i}")`
        },
        {
          question: "What's 'Scratch Mode'?",
          answer: "Scratch Mode is the default coding environment when you don't have any files open. It's perfect for quick experiments and learning. Your code is automatically saved to your browser's local storage, so you won't lose it when you refresh the page. When you're ready, you can save your scratch code as a file using the 'Save As File' option in the toolbar."
        },
        {
          question: "How do I create and manage files?",
          answer: `Click the "New File" button in the file explorer on the left side:\n1. Enter a filename with the appropriate extension (.py for Python, .r for R)\n2. Your file appears in the explorer\n3. Click on any file to open it in the editor\n4. Right-click files for options like rename, delete, and download\n5. Files are automatically saved to your browser's IndexedDB`
        }
      ]
    },
    {
      title: "AI Features",
      icon: <Brain className="w-5 h-5" />,
      level: "Beginner",
      duration: "7 min",
      topics: [
        {
          question: "How does Plain English Mode work?",
          answer: `Plain English Mode translates complex error messages into simple explanations:\n\n1. Toggle the lightbulb icon in the console header\n2. When enabled, any error will be analyzed by AI\n3. You'll see:\n   • What happened (simple description)\n   • Why it happened (root cause)\n   • How to fix it (step-by-step solution)\n   • Related concepts to learn\n\n4. Click "View Raw Error" to see the original message\n5. Click "View Explanation" to switch back\n\nThis feature helps you learn from mistakes and understand programming concepts better!`
        },
        {
          question: "What can the AI Code Assistant do?",
          answer: `The AI Assistant (click the sparkles icon) can:\n\n• Scan Code: Find bugs, security issues, and improvements\n• Autofill: Complete your code based on context\n• Autocomplete: Suggest next lines as you type\n• Explain Code: Break down what your code does\n• Check Logic: Verify your code's correctness\n• Optimize: Suggest performance improvements\n\nTo use: Select code (or leave empty for full file analysis), click the AI button, and choose an action.`
        },
        {
          question: "How do I translate code between languages?",
          answer: `Use the Translate feature to convert code between Python, R, JavaScript, and SQL:\n\n1. Click the "Translate" button in the toolbar\n2. Select your source language (current code)\n3. Select your target language\n4. Click "Translate"\n5. The AI will convert your code while preserving logic\n6. Copy the result or load it into the editor\n\nGreat for learning how different languages express the same logic!`
        }
      ]
    },
    {
      title: "Data Science Workflow",
      icon: <Database className="w-5 h-5" />,
      level: "Intermediate",
      duration: "10 min",
      topics: [
        {
          question: "How do I upload and analyze CSV files?",
          answer: `Complete workflow for CSV analysis:\n\n1. Click "Upload CSV" in the toolbar\n2. Select your CSV file (max 5MB on mobile, 20MB on desktop)\n3. View your data in the Dataset Viewer\n4. Use DataLab to get AI recommendations for cleaning\n5. Apply data operations (filter, sort, group) with the Data Operations tool\n6. Generate code for your transformations\n7. Run the code to process your data\n\nPython example:\nimport pandas as pd\ndf = pd.read_csv('yourfile.csv')\nprint(df.head())\nprint(df.describe())`
        },
        {
          question: "What's DataLab and how do I use it?",
          answer: `DataLab is your AI data analyst:\n\n1. Upload a CSV file first\n2. Click "DataLab" in the side panel\n3. Select your dataset and target column (if doing prediction)\n4. Choose your language (Python/R)\n5. Click "Get Recommendations"\n6. Review AI suggestions for:\n   • Data cleaning (handling missing values)\n   • Feature engineering\n   • Exploratory analysis\n   • Suggested code snippets\n7. Copy and run the generated code\n\nPerfect for getting started with unfamiliar datasets!`
        },
        {
          question: "How do I create visualizations?",
          answer: `Three ways to create plots:\n\n**Method 1: Write Code**\nPython (matplotlib):\nimport matplotlib.pyplot as plt\nplt.plot([1, 2, 3, 4])\nplt.ylabel('Values')\nplt.show()\n\nR (ggplot2):\nlibrary(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()\n\n**Method 2: Plot Builder**\n1. Click "Plot Builder" in toolbar\n2. Select your dataset and variables\n3. Choose plot type (scatter, line, bar, histogram)\n4. Customize colors and labels\n5. Click "Generate Plot"\n6. View, download, or get the code\n\n**Method 3: ML Operations**\nCreate plots automatically when building models`
        }
      ]
    },
    {
      title: "Advanced Features",
      icon: <Sparkles className="w-5 h-5" />,
      level: "Advanced",
      duration: "12 min",
      topics: [
        {
          question: "How do I use Notebook Mode?",
          answer: `Jupyter-style notebooks for mixing code, output, and notes:\n\n1. Click "Notebook Mode" in the toolbar\n2. Create cells with the + button\n3. Choose cell type:\n   • Code: Execute Python/R\n   • Markdown: Write formatted text (supports headings, lists, **bold**, *italic*)\n4. Run cells individually with the play button\n5. Reorder cells by dragging\n6. Delete cells with the trash icon\n7. Switch back to regular mode anytime\n\nPerfect for:\n• Data analysis reports\n• Tutorial creation\n• Research documentation\n• Step-by-step workflows`
        },
        {
          question: "How do I install packages?",
          answer: `bIDE supports many Python packages through Pyodide:\n\n1. Click "Package Manager" in the toolbar\n2. Search for a package (e.g., "scikit-learn")\n3. Click "Install"\n4. Wait for installation (can take 30s - 2min)\n5. Use in your code immediately\n\n**Pre-included packages:**\n• numpy, pandas, matplotlib\n• scipy, scikit-learn\n• statsmodels, seaborn\n\n**Note:** Not all PyPI packages work in the browser. If a package fails, check the console for compatibility info.`
        },
        {
          question: "What are ML Operations?",
          answer: `Build machine learning models without writing code:\n\n1. Upload a CSV with your dataset\n2. Open "ML Operations" from side panel\n3. Select your dataset\n4. Choose features (X variables) and target (Y variable)\n5. Select model type:\n   • Linear Regression: Predict continuous values\n   • Logistic Regression: Binary classification\n   • Decision Tree: Classification or regression\n6. Click "Train Model"\n7. View:\n   • Model metrics (accuracy, R², etc.)\n   • Generated code to reproduce\n   • Visualization of results\n8. Copy code to customize further`
        },
        {
          question: "How do I share my code?",
          answer: `Multiple ways to share your work:\n\n**Share Dialog:**\n1. Click "Share" in toolbar\n2. Add optional title and description\n3. Set expiration (never, 1 day, 7 days, 30 days)\n4. Click "Create Share Link"\n5. Copy the link and share anywhere\n6. Recipients can view and copy your code\n\n**Download:**\n• Click "Download" to save as .py or .r file\n• Share via email, cloud storage, etc.\n\n**Portfolio Export:**\n1. Click "Portfolio Export"\n2. Select multiple files\n3. Add project info\n4. Generate beautiful HTML portfolio\n5. Download and host anywhere`
        },
        {
          question: "How does Lab Trainer work?",
          answer: `Generate programming challenges to practice:\n\n1. Click "Lab Trainer" in toolbar\n2. Select difficulty:\n   • Beginner: Basic syntax and concepts\n   • Intermediate: Data structures and algorithms\n   • Advanced: Complex problem-solving\n3. Choose topic or get random challenge\n4. Read the challenge description\n5. Review hints for your level\n6. Write your solution\n7. Test against expected output\n8. Save to history to track progress\n\nPerfect for:\n• Interview preparation\n• Learning new concepts\n• Daily coding practice\n• Skill assessment`
        }
      ]
    },
    {
      title: "Tips & Tricks",
      icon: <Lightbulb className="w-5 h-5" />,
      level: "All Levels",
      duration: "5 min",
      topics: [
        {
          question: "Keyboard Shortcuts",
          answer: `Speed up your workflow:\n\n• Run Code: Ctrl+Enter (Cmd+Enter on Mac)\n• Save File: Ctrl+S (Cmd+S on Mac)\n• New File: Ctrl+N (Cmd+N on Mac)\n• Find in Editor: Ctrl+F (Cmd+F on Mac)\n• Replace: Ctrl+H (Cmd+H on Mac)\n• Comment Line: Ctrl+/ (Cmd+/ on Mac)\n• Toggle Console: In toolbar\n\nMonaco Editor shortcuts:\n• Multi-cursor: Alt+Click\n• Select All Occurrences: Ctrl+Shift+L\n• Move Line Up/Down: Alt+Up/Down`
        },
        {
          question: "Performance Tips",
          answer: `Make bIDE run faster:\n\n**On Mobile:**\n• Limit CSV files to < 5MB\n• Close unused panels\n• Clear console regularly (trash icon)\n• Avoid large loops (> 100k iterations)\n• Use smaller datasets for practice\n\n**On Desktop:**\n• CSV files up to 20MB work well\n• Install packages once, reuse them\n• Clear browser cache if slow\n• Use latest Chrome, Firefox, or Edge\n\n**For All Devices:**\n• Code incrementally and test often\n• Use Plain English Mode only when needed\n• Close Plot Viewer after saving plots`
        },
        {
          question: "Data Persistence",
          answer: `Your work is automatically saved:\n\n**What's saved:**\n• All files in File Explorer\n• Scratch Mode code\n• Installed packages (session only)\n• Console output (cleared on refresh)\n• Uploaded CSV files (until page refresh)\n\n**Where it's saved:**\n• IndexedDB in your browser\n• Stays even if you close the tab\n• Specific to this device/browser\n\n**To preserve work:**\n• Download important files\n• Use Share links for backups\n• Export portfolios for archival\n\n**Clear storage:**\n• Browser Settings > Clear Data\n• Delete individual files in File Explorer`
        },
        {
          question: "Troubleshooting Common Issues",
          answer: `Quick fixes for common problems:\n\n**Code won't run:**\n• Check if runtime is initialized (status icon)\n• Verify syntax (use AI to check)\n• Try clearing console and running again\n\n**Package won't install:**\n• Check compatibility (console shows reason)\n• Some packages need native dependencies\n• Try alternative packages\n\n**CSV won't load:**\n• Check file size limits\n• Ensure proper CSV formatting\n• Try smaller sample first\n\n**Slow performance:**\n• Refresh the page\n• Close unused tools\n• Clear browser cache\n• Reduce dataset size\n\n**Plot not showing:**\n• Use plt.show() in Python\n• Use print(plot) in R\n• Check Plot Viewer panel`
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Breadcrumb Schema for SEO */}
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://bideide.com/" },
        { name: "Tutorials", url: "https://bideide.com/tutorials" }
      ]} />
      
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
                <h1 className="text-2xl font-bold text-foreground">Tutorials & Guides</h1>
                <p className="text-sm text-muted-foreground">Learn how to use every feature in bIDE</p>
              </div>
            </div>
            <Button onClick={() => navigate("/ide")} size="lg" className="gap-2">
              Start Coding
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="w-4 h-4 mr-2" />
            Complete Learning Path
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Master bIDE
          </h2>
          <p className="text-xl text-muted-foreground">
            Step-by-step guides for beginners to advanced users. 
            Learn by doing with practical examples.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="p-8 mb-12 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-lg bg-primary/10">
              <Terminal className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3 text-foreground">Quick Start (30 seconds)</h3>
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Click "Start Coding" to open the IDE</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>Choose Python or R from the language selector</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>Type: <code className="px-2 py-1 rounded bg-muted">print("Hello, bIDE!")</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">4.</span>
                  <span>Click Run or press Ctrl+Enter</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">5.</span>
                  <span>See output in console below 🎉</span>
                </li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Tutorial Sections */}
        <div className="space-y-8">
          {tutorials.map((section, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10 text-accent">
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{section.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline">{section.level}</Badge>
                      <span className="text-sm text-muted-foreground">• {section.duration} read</span>
                      <span className="text-sm text-muted-foreground">• {section.topics.length} topics</span>
                    </div>
                  </div>
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {section.topics.map((topic, topicIdx) => (
                  <AccordionItem key={topicIdx} value={`item-${idx}-${topicIdx}`}>
                    <AccordionTrigger className="text-left hover:text-primary">
                      <div className="flex items-center gap-3">
                        <ChevronRight className="w-4 h-4" />
                        <span className="font-medium">{topic.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-7 pt-2">
                        <pre className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed font-sans">
                          {topic.answer}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="p-12 bg-gradient-to-r from-secondary/5 to-primary/5 border-secondary/20">
            <h3 className="text-3xl font-bold mb-4 text-foreground">Ready to Build Something Amazing?</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Now that you know the tools, it's time to create. Launch the IDE and start your journey!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => navigate("/ide")} size="lg" className="gap-2">
                <Code2 className="w-5 h-5" />
                Launch IDE
              </Button>
              <Button onClick={() => navigate("/features")} variant="outline" size="lg" className="gap-2">
                <FileCode className="w-5 h-5" />
                View All Features
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Have questions? Submit feedback from the IDE • bIDE © 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default Tutorials;
