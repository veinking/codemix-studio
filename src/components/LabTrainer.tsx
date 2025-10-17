import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Beaker, ChevronDown, ChevronRight, Lightbulb, Rocket, BookOpen, Trophy, Target, CheckCircle2, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LabTrainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadLab?: (content: string, title: string) => void;
}

interface LabData {
  title: string;
  theme: string;
  description: string;
  hints: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
  extra_hints: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
  expected_output: string;
  concepts?: string[];
  learning_objectives?: string[];
  related_topics?: string[];
}

interface ProgressStats {
  beginner: number;
  intermediate: number;
  advanced: number;
  total: number;
}

export const LabTrainer = ({ open, onOpenChange, onLoadLab }: LabTrainerProps) => {
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [topic, setTopic] = useState("Random");
  const [currentLab, setCurrentLab] = useState<{ text: string; lab: LabData } | null>(null);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [revealedExtraHints, setRevealedExtraHints] = useState<number>(0);
  const [showConcepts, setShowConcepts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressStats, setProgressStats] = useState<ProgressStats>({ beginner: 0, intermediate: 0, advanced: 0, total: 0 });
  const [usedHints, setUsedHints] = useState(false);
  const [activeTab, setActiveTab] = useState("practice");

  const topicCategories = {
    "🎯 Getting Started": ["Random"],
    "💻 CS Fundamentals": ["loops & conditionals", "functions & recursion", "sorting algorithms", "searching algorithms"],
    "🗂️ Data Structures": ["lists & arrays", "dictionaries & hash tables", "stacks & queues", "trees & graphs", "linked lists"],
    "📊 Statistics & Math": ["descriptive statistics", "probability distributions", "hypothesis testing", "linear algebra basics", "matrix operations"],
    "🔬 Data Science": ["data cleaning & preprocessing", "exploratory data analysis", "data visualization", "correlation & regression"],
    "🤖 Machine Learning": ["train-test split", "linear regression", "classification basics", "model evaluation"],
    "🐍 Python Skills": ["list comprehensions", "file I/O operations", "exception handling", "object-oriented programming"],
    "🧩 Problem Solving": ["string manipulation", "number theory", "math fundamentals"],
    "🎯 Applications": ["nutrition analysis", "fitness analytics", "finance & markets", "text processing"],
  };

  const allTopics = Object.values(topicCategories).flat();

  // Load progress stats
  useEffect(() => {
    const loadProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('labs_progress')
          .select('*')
          .eq('user_id', user.id);
        
        if (data) {
          const stats = {
            beginner: data.find(p => p.difficulty === 'beginner')?.completed_count || 0,
            intermediate: data.find(p => p.difficulty === 'intermediate')?.completed_count || 0,
            advanced: data.find(p => p.difficulty === 'advanced')?.completed_count || 0,
            total: data.reduce((sum, p) => sum + p.completed_count, 0)
          };
          setProgressStats(stats);
        }
      }
    };
    if (open) loadProgress();
  }, [open]);

  const generateLab = async () => {
    setLoading(true);
    setRevealedHints(0);
    setRevealedExtraHints(0);
    setUsedHints(false);
    setShowConcepts(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('lab-trainer', {
        body: { difficulty, topic: topic === "Random" ? null : topic }
      });

      if (error) throw error;

      setCurrentLab(data);
      setActiveTab("practice");

      // Save to history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('labs_history').insert({
          user_id: user.id,
          lab_title: data.lab.title,
          lab_theme: data.lab.theme,
          difficulty,
          lab_content: data.text
        });

        // Update progress
        const { data: existingProgress } = await supabase
          .from('labs_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('difficulty', difficulty)
          .maybeSingle();

        if (existingProgress) {
          await supabase
            .from('labs_progress')
            .update({ completed_count: existingProgress.completed_count + 1 })
            .eq('id', existingProgress.id);
          
          setProgressStats(prev => ({
            ...prev,
            [difficulty]: existingProgress.completed_count + 1,
            total: prev.total + 1
          }));
        } else {
          await supabase.from('labs_progress').insert({
            user_id: user.id,
            difficulty,
            completed_count: 1
          });
          
          setProgressStats(prev => ({
            ...prev,
            [difficulty]: 1,
            total: prev.total + 1
          }));
        }
      }

      toast.success("Lab Generated!", { description: `New ${difficulty} challenge ready. Good luck! 🚀` });
    } catch (error) {
      console.error('Error generating lab:', error);
      toast.error("Failed to generate lab", { description: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const revealNextHint = () => {
    setUsedHints(true);
    setRevealedHints(prev => prev + 1);
  };

  const revealNextExtraHint = () => {
    setUsedHints(true);
    setRevealedExtraHints(prev => prev + 1);
  };

  const handleLoadIntoEditor = () => {
    if (currentLab && onLoadLab) {
      const template = `# ${currentLab.lab.title}\n# ${currentLab.lab.theme}\n\n# Challenge:\n# ${currentLab.lab.description}\n\n# TODO: Write your code here\n\n`;
      onLoadLab(template, `${currentLab.lab.title.toLowerCase().replace(/\s+/g, '_')}.py`);
      toast.success("Loaded into Editor", { description: "Start coding! 💻" });
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSuggestedDifficulty = () => {
    if (progressStats.beginner < 3) return "beginner";
    if (progressStats.intermediate < 3) return "intermediate";
    return "advanced";
  };

  const totalHints = currentLab?.lab.hints[difficulty]?.length || 0;
  const totalExtraHints = currentLab?.lab.extra_hints[difficulty]?.length || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[600px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-primary" />
              Practice Labs
            </SheetTitle>
            {progressStats.total > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" />
                {progressStats.total} completed
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-80px)]">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-160px)]">
            <div className="p-6 pt-4 space-y-4">
              <TabsContent value="practice" className="mt-0 space-y-4">
                {/* Generator Controls */}
                <Card className="p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Difficulty</label>
                      {getSuggestedDifficulty() !== difficulty && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setDifficulty(getSuggestedDifficulty() as any)}
                          className="h-6 text-xs"
                        >
                          <Target className="h-3 w-3 mr-1" />
                          Try {getSuggestedDifficulty()}
                        </Button>
                      )}
                    </div>
                    <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">
                          <div className="flex items-center gap-2">
                            🟢 Beginner
                            {progressStats.beginner > 0 && (
                              <span className="text-xs text-muted-foreground">({progressStats.beginner})</span>
                            )}
                          </div>
                        </SelectItem>
                        <SelectItem value="intermediate">
                          <div className="flex items-center gap-2">
                            🟡 Intermediate
                            {progressStats.intermediate > 0 && (
                              <span className="text-xs text-muted-foreground">({progressStats.intermediate})</span>
                            )}
                          </div>
                        </SelectItem>
                        <SelectItem value="advanced">
                          <div className="flex items-center gap-2">
                            🔴 Advanced
                            {progressStats.advanced > 0 && (
                              <span className="text-xs text-muted-foreground">({progressStats.advanced})</span>
                            )}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic</label>
                    <Select value={topic} onValueChange={setTopic}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px]">
                        {Object.entries(topicCategories).map(([category, topics]) => (
                          <React.Fragment key={category}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              {category}
                            </div>
                            {topics.map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={generateLab} disabled={loading} className="w-full">
                    <Rocket className="h-4 w-4 mr-2" />
                    {loading ? "Generating..." : "Generate New Lab"}
                  </Button>
                </Card>

                {/* Lab Display */}
                {currentLab ? (
                  <>
                    {/* Lab Header */}
                    <Card className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold text-lg">{currentLab.lab.title}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{currentLab.lab.theme}</p>
                        </div>
                        <Badge className={getDifficultyColor(difficulty)}>
                          {difficulty}
                        </Badge>
                      </div>

                      {/* Learn First Section */}
                      <Collapsible open={showConcepts} onOpenChange={setShowConcepts}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <BookOpen className="h-4 w-4 mr-2" />
                            {showConcepts ? "Hide" : "Show"} Concepts First
                            <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${showConcepts ? 'rotate-90' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          <div className="p-3 bg-muted/50 rounded-md space-y-2">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <Brain className="h-4 w-4" />
                              What You'll Learn:
                            </h5>
                            <p className="text-sm">
                              This lab helps you practice <strong>{currentLab.lab.theme}</strong>. Take time to understand the problem before coding. Break it down into steps.
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Your Challenge:
                        </h4>
                        <p className="text-sm leading-relaxed">{currentLab.lab.description}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Expected Outcome:
                        </h4>
                        <p className="text-sm leading-relaxed">{currentLab.lab.expected_output}</p>
                      </div>

                      <Button onClick={handleLoadIntoEditor} className="w-full" variant="secondary">
                        <Rocket className="h-4 w-4 mr-2" />
                        Start Coding
                      </Button>
                    </Card>

                    {/* Progressive Hints */}
                    <Card className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Guided Hints
                        </h4>
                        {usedHints && (
                          <Badge variant="secondary" className="text-xs">
                            Using hints
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {revealedHints > 0 && (
                          <div className="space-y-2">
                            {currentLab.lab.hints[difficulty].slice(0, revealedHints).map((hint, i) => (
                              <div key={i} className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                                <p className="text-sm">
                                  <span className="font-medium">Step {i + 1}:</span> {hint}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {revealedHints < totalHints && (
                          <Button 
                            onClick={revealNextHint} 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                          >
                            <Lightbulb className="h-4 w-4 mr-2" />
                            {revealedHints === 0 ? "Show First Hint" : "Show Next Hint"}
                            <span className="ml-auto text-xs text-muted-foreground">
                              ({revealedHints}/{totalHints})
                            </span>
                          </Button>
                        )}

                        {revealedHints === totalHints && totalHints > 0 && (
                          <div className="pt-2 space-y-2">
                            <p className="text-xs text-muted-foreground">Need more help?</p>
                            
                            {revealedExtraHints > 0 && (
                              <div className="space-y-2">
                                {currentLab.lab.extra_hints[difficulty].slice(0, revealedExtraHints).map((hint, i) => (
                                  <div key={i} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                    <p className="text-sm">
                                      <span className="font-medium">💡 Extra:</span> {hint}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {revealedExtraHints < totalExtraHints && (
                              <Button 
                                onClick={revealNextExtraHint} 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                              >
                                Show Extra Hint ({revealedExtraHints}/{totalExtraHints})
                              </Button>
                            )}

                            {revealedExtraHints === totalExtraHints && (
                              <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm">
                                  ✨ You've seen all hints! Try to solve it with what you learned. You've got this! 💪
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground space-y-3">
                    <Beaker className="h-12 w-12 mx-auto opacity-50" />
                    <div className="space-y-1">
                      <p className="font-medium">Ready to Practice?</p>
                      <p className="text-sm">Generate a lab to get started on your coding journey! 🚀</p>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="progress" className="mt-0 space-y-4">
                {/* Progress Overview */}
                <Card className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Your Progress</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500"></span>
                          Beginner
                        </span>
                        <span className="font-medium">{progressStats.beginner} labs</span>
                      </div>
                      <Progress value={(progressStats.beginner / Math.max(progressStats.total, 1)) * 100} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                          Intermediate
                        </span>
                        <span className="font-medium">{progressStats.intermediate} labs</span>
                      </div>
                      <Progress value={(progressStats.intermediate / Math.max(progressStats.total, 1)) * 100} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          Advanced
                        </span>
                        <span className="font-medium">{progressStats.advanced} labs</span>
                      </div>
                      <Progress value={(progressStats.advanced / Math.max(progressStats.total, 1)) * 100} className="h-2" />
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Completed</span>
                      <span className="text-2xl font-bold text-primary">{progressStats.total}</span>
                    </div>
                  </div>
                </Card>

                {/* Learning Path */}
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Suggested Next Steps</h3>
                  </div>

                  <div className="space-y-2">
                    {progressStats.beginner < 3 && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                        <p className="text-sm">
                          <strong>Build Foundation:</strong> Complete {3 - progressStats.beginner} more beginner labs to strengthen your basics.
                        </p>
                      </div>
                    )}
                    
                    {progressStats.beginner >= 3 && progressStats.intermediate < 3 && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                        <p className="text-sm">
                          <strong>Level Up:</strong> Try intermediate challenges to expand your skills!
                        </p>
                      </div>
                    )}

                    {progressStats.intermediate >= 3 && progressStats.advanced < 3 && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                        <p className="text-sm">
                          <strong>Master Level:</strong> Ready for advanced labs? Push your limits!
                        </p>
                      </div>
                    )}

                    {progressStats.advanced >= 3 && (
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                        <p className="text-sm">
                          <strong>Keep Growing:</strong> Explore new topics and keep challenging yourself! 🚀
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
