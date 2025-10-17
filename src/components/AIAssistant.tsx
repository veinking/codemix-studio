import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Wand2, CheckCircle, Lightbulb, X, Zap, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIAssistantProps {
  code: string;
  language: string;
  onCodeUpdate: (code: string) => void;
  selectedCode?: string;
  isMobile?: boolean;
}

export const AIAssistant = ({ code, language, onCodeUpdate, selectedCode, isMobile = false }: AIAssistantProps) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  // Auto-scan every 5 minutes
  useEffect(() => {
    if (!code || code.trim().length === 0) return;

    const scanInterval = setInterval(() => {
      handleAutoScan();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(scanInterval);
  }, [code, language]);

  const handleAutoScan = async () => {
    if (code.trim().length === 0) return;
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-code-assistant", {
        body: { action: "scan", code, language, isMobile },
      });

      if (error) throw error;

      if (data?.result) {
        setSuggestion(data.result);
        setLastScanTime(new Date());
        toast.info("AI has analyzed your code", {
          description: "Check the suggestions below",
        });
      }
    } catch (error) {
      console.error("Auto-scan error:", error);
    }
  };

  const handleAIAction = async (action: "autofill" | "autocomplete" | "check" | "optimize" | "explain") => {
    if (action === "autofill" && !prompt.trim()) {
      toast.error("Please enter a goal or description");
      return;
    }

    if (action === "check" && !selectedCode && !code) {
      toast.error("No code to check");
      return;
    }

    setIsLoading(true);
    setSuggestion(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-code-assistant", {
        body: {
          action,
          code,
          prompt: prompt.trim(),
          language,
          selectedCode,
          isMobile,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const result = data?.result;

      if (action === "autofill" || action === "autocomplete" || action === "optimize") {
        // Update the editor with the generated/completed/optimized code
        onCodeUpdate(result);
        toast.success(
          action === "autofill" ? "Code generated!" : 
          action === "autocomplete" ? "Code completed!" : 
          "Code optimized with best practices!"
        );
        setPrompt("");
      } else {
        // Show suggestions for check/explain actions
        setSuggestion(result);
        toast.success(action === "explain" ? "Code explained!" : "Code analysis complete");
      }
    } catch (error: any) {
      console.error("AI action error:", error);
      toast.error(error.message || "AI request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-background/95 backdrop-blur border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AI Code Assistant</span>
        </div>
        {lastScanTime && (
          <span className="text-xs text-muted-foreground">
            Last scan: {lastScanTime.toLocaleTimeString()}
          </span>
        )}
      </div>

      <Textarea
        placeholder="Describe what you want to build or what the code should do..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[80px] resize-none"
        disabled={isLoading}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => handleAIAction("autofill")}
          disabled={isLoading || !prompt.trim()}
          className="flex items-center gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Auto Fill
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleAIAction("autocomplete")}
          disabled={isLoading || !code}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Auto Complete
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAIAction("explain")}
          disabled={isLoading || !selectedCode}
          className="flex items-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Explain
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAIAction("check")}
          disabled={isLoading || (!code && !selectedCode)}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Check Code
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleAutoScan}
          disabled={isLoading || !code}
          className="flex items-center gap-2"
        >
          <Lightbulb className="h-4 w-4" />
          Scan Now
        </Button>

        <Button
          size="sm"
          variant="default"
          onClick={() => handleAIAction("optimize")}
          disabled={isLoading || !code}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80"
        >
          <Zap className="h-4 w-4" />
          Optimize
        </Button>
      </div>

      {suggestion && (
        <Card className="p-3 relative">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => setSuggestion(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="pr-8">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">AI Suggestions</span>
            </div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {suggestion}
            </div>
          </div>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>AI is thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};
