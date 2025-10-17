import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Beaker, ChevronDown, ChevronUp, Lightbulb, Rocket, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}

export const LabTrainer = ({ open, onOpenChange, onLoadLab }: LabTrainerProps) => {
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [topic, setTopic] = useState("Random");
  const [currentLab, setCurrentLab] = useState<{ text: string; lab: LabData } | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const topics = [
    "Random",
    // CS Fundamentals
    "loops & conditionals",
    "functions & recursion",
    "sorting algorithms",
    "searching algorithms",
    // Data Structures
    "lists & arrays",
    "dictionaries & hash tables",
    "stacks & queues",
    "trees & graphs",
    "linked lists",
    // Statistics & Math
    "descriptive statistics",
    "probability distributions",
    "hypothesis testing",
    "linear algebra basics",
    "matrix operations",
    // Data Science
    "data cleaning & preprocessing",
    "exploratory data analysis",
    "data visualization",
    "correlation & regression",
    // Machine Learning
    "train-test split",
    "linear regression",
    "classification basics",
    "model evaluation",
    // Python Specific
    "list comprehensions",
    "file I/O operations",
    "exception handling",
    "object-oriented programming",
    // General Problem Solving
    "string manipulation",
    "number theory",
    "math fundamentals",
    // Application Domains
    "nutrition analysis",
    "fitness analytics",
    "finance & markets",
    "text processing",
  ];

  const generateLab = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lab-trainer', {
        body: { difficulty, topic: topic === "Random" ? null : topic }
      });

      if (error) throw error;

      setCurrentLab(data);
      setHintsOpen(false);

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
          .single();

        if (existingProgress) {
          await supabase
            .from('labs_progress')
            .update({ completed_count: existingProgress.completed_count + 1 })
            .eq('id', existingProgress.id);
        } else {
          await supabase.from('labs_progress').insert({
            user_id: user.id,
            difficulty,
            completed_count: 1
          });
        }
      }

      toast({
        title: "Lab Generated!",
        description: `New ${difficulty} level challenge ready.`,
      });
    } catch (error) {
      console.error('Error generating lab:', error);
      toast({
        title: "Error",
        description: "Failed to generate lab. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadIntoEditor = () => {
    if (currentLab && onLoadLab) {
      const template = `# ${currentLab.lab.title}\n# ${currentLab.lab.theme}\n\n# Challenge:\n# ${currentLab.lab.description}\n\n# TODO: Write your code here\n\n`;
      onLoadLab(template, `${currentLab.lab.title.toLowerCase().replace(/\s+/g, '_')}.py`);
      toast({
        title: "Loaded into Editor",
        description: "Lab template created. Start coding!",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[500px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-primary" />
              Practice Labs
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-6 space-y-4">
            {/* Controls */}
            <Card className="p-4 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Topic</label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateLab} disabled={loading} className="w-full">
                <Rocket className="h-4 w-4 mr-2" />
                {loading ? "Generating..." : "Generate Lab"}
              </Button>
            </Card>

            {/* Lab Display */}
            {currentLab && (
              <Card className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{currentLab.lab.title}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{currentLab.lab.theme}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Challenge:</h4>
                  <p className="text-sm">{currentLab.lab.description}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Expected Outcome:</h4>
                  <p className="text-sm">{currentLab.lab.expected_output}</p>
                </div>

                <Collapsible open={hintsOpen} onOpenChange={setHintsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      {hintsOpen ? "Hide" : "Show"} Hints
                      {hintsOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Basic Hints:</h5>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        {currentLab.lab.hints[difficulty].map((hint, i) => (
                          <li key={i}>{hint}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm mb-2">Extra Hints:</h5>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        {currentLab.lab.extra_hints[difficulty].map((hint, i) => (
                          <li key={i}>{hint}</li>
                        ))}
                      </ul>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Button onClick={handleLoadIntoEditor} className="w-full" variant="secondary">
                  Load into Editor
                </Button>
              </Card>
            )}

            {!currentLab && (
              <Card className="p-8 text-center text-muted-foreground">
                <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Generate a lab to get started!</p>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
