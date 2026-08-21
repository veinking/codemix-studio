import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, Loader2, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIAssistantProps {
  code: string;
  language: string;
  onCodeUpdate: (code: string) => void;
  selectedCode?: string;
  isMobile?: boolean;
}

type AssistAction = "ask" | "review" | "complete";
type AssistModel = "gemini-2.5-flash-lite" | "gemini-2.5-flash";

const SESSION_KEY = "bide.code-assist.gemini-key.v1";

function stripCodeFence(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:[a-zA-Z0-9_+-]+)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1].trim() : trimmed;
}

export const AIAssistant = ({ code, language, onCodeUpdate, selectedCode }: AIAssistantProps) => {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [action, setAction] = useState<AssistAction>("ask");
  const [model, setModel] = useState<AssistModel>("gemini-2.5-flash-lite");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setApiKey(sessionStorage.getItem(SESSION_KEY) || "");
  }, []);

  function rememberKey(value: string) {
    setApiKey(value);
    if (value.trim()) sessionStorage.setItem(SESSION_KEY, value.trim());
    else sessionStorage.removeItem(SESSION_KEY);
  }

  function forgetKey() {
    setApiKey("");
    sessionStorage.removeItem(SESSION_KEY);
    toast.success("Code Assist key cleared from this browser session.");
  }

  async function runAssist(nextAction: AssistAction = action) {
    if (!apiKey.trim()) {
      toast.error("Add your Gemini API key first.");
      return;
    }
    if (nextAction === "ask" && !prompt.trim()) {
      toast.error("Ask a question first.");
      return;
    }
    if ((nextAction === "review" || nextAction === "complete") && !String(selectedCode || code).trim()) {
      toast.error("There is no code to send.");
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error("Code Assist relay is not configured on this deployment.");
      return;
    }

    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-code-assistant", {
        body: {
          action: nextAction,
          code,
          prompt: prompt.trim() || undefined,
          selectedCode: selectedCode || undefined,
          language,
          model,
          apiKey: apiKey.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.result) throw new Error("Code Assist returned an empty response.");
      setAction(nextAction);
      setResult(String(data.result));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Code Assist request failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const completion = action === "complete" ? stripCodeFence(result) : result;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Code Assist · BYOK</h3>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Optional help using your Gemini key. bIDE does not include automatic scans or a bundled AI allowance.
        </p>
      </div>

      <Card className="space-y-3 border-border bg-card/60 p-3 shadow-none">
        <label className="block text-xs font-medium text-muted-foreground">Gemini API key</label>
        <Input
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => rememberKey(event.target.value)}
          placeholder="AIza…"
          className="h-9 font-mono text-xs"
        />
        <div className="flex items-start gap-2 text-[11px] leading-4 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span>The key is kept in sessionStorage and sent only to the constrained bIDE relay for the request. Close the browser session or use Forget key to clear it.</span>
        </div>
        {apiKey && (
          <Button variant="ghost" size="sm" onClick={forgetKey} className="h-7 px-2 text-xs text-muted-foreground">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Forget key
          </Button>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Task</label>
          <Select value={action} onValueChange={(value) => setAction(value as AssistAction)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ask">Ask about code</SelectItem>
              <SelectItem value="review">Review code</SelectItem>
              <SelectItem value="complete">Complete code</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Model</label>
          <Select value={model} onValueChange={(value) => setModel(value as AssistModel)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash-lite">Flash Lite · cheapest</SelectItem>
              <SelectItem value="gemini-2.5-flash">Flash · stronger</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {action === "ask" && (
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="What is wrong with this function? How can I parse this CSV?"
          className="min-h-[92px] resize-y text-sm"
        />
      )}

      <Button onClick={() => runAssist()} disabled={loading} className="w-full shadow-none">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        {loading ? "Working…" : action === "ask" ? "Ask" : action === "review" ? "Review code" : "Complete code"}
      </Button>

      {result && (
        <Card className="space-y-3 border-border bg-card/60 p-3 shadow-none">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold">Result</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigator.clipboard.writeText(completion).then(() => toast.success("Copied."))}
              title="Copy result"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-md bg-background/70 p-3 font-mono text-xs leading-5 text-foreground">
            {completion}
          </pre>
          {action === "complete" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                onCodeUpdate(completion);
                toast.success("Completion applied to the editor.");
              }}
            >
              <Check className="mr-2 h-4 w-4" /> Apply to editor
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};
