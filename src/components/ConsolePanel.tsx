import React from "react";
import { Terminal, Trash2, Lightbulb, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ErrorExplanation {
  what: string;
  why: string;
  fix: string;
  concepts: string[];
}

interface ConsoleMessage {
  text: string;
  explanation?: ErrorExplanation;
  isError?: boolean;
}

interface ConsolePanelProps {
  output: ConsoleMessage[];
  onClear: () => void;
  plainEnglishMode: boolean;
  onTogglePlainEnglish: () => void;
  hasNewOutput?: boolean;
}

export const ConsolePanel = ({ output, onClear, plainEnglishMode, onTogglePlainEnglish, hasNewOutput }: ConsolePanelProps) => {
  const [showRawError, setShowRawError] = React.useState<number | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new output
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [output.length]);

  const getOutputStyle = (message: ConsoleMessage) => {
    if (message.isError) {
      return "border-l-4 border-l-destructive bg-destructive/5 pl-3 py-2";
    }
    if (message.text.includes('✓') || message.text.toLowerCase().includes('success')) {
      return "border-l-4 border-l-green-500 bg-green-500/5 pl-3 py-2";
    }
    if (message.text.includes('⚠️') || message.text.toLowerCase().includes('warning')) {
      return "border-l-4 border-l-yellow-500 bg-yellow-500/5 pl-3 py-2";
    }
    return "py-1";
  };

  return (
    <div className={`h-full bg-console border-t flex flex-col transition-all ${hasNewOutput ? 'border-primary shadow-[0_-2px_8px_rgba(168,85,247,0.3)]' : 'border-border'}`}>
      <div className="flex items-center justify-between p-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Console</h3>
          {plainEnglishMode && (
            <Badge variant="secondary" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" />
              Plain English
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onTogglePlainEnglish}
            title={plainEnglishMode ? "Show raw errors" : "Explain errors in Plain English"}
          >
            {plainEnglishMode ? <Code className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClear}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        {output.length === 0 ? (
          <p className="text-sm text-muted-foreground">No output yet. Run your code to see results.</p>
        ) : (
          <div className="space-y-2">
            {output.map((message, index) => {
              const outputStyle = getOutputStyle(message);
              const isExplainedError = message.isError && message.explanation && plainEnglishMode;
              const showingRaw = showRawError === index;

              if (isExplainedError && !showingRaw) {
                return (
                  <div key={index} className="border border-primary/20 rounded-lg p-3 bg-card/50 space-y-2">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            What happened
                          </p>
                          <p className="text-sm text-foreground">{message.explanation.what}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Why it happened
                          </p>
                          <p className="text-sm text-foreground">{message.explanation.why}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            How to fix it
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{message.explanation.fix}</p>
                        </div>

                        {message.explanation.concepts.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Learn more about
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {message.explanation.concepts.map((concept, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {concept}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 mt-1"
                          onClick={() => setShowRawError(index)}
                        >
                          <Code className="w-3 h-3 mr-1" />
                          View Raw Error
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }

              if (isExplainedError && showingRaw) {
                return (
                  <div key={index} className="space-y-1">
                    <div className="font-mono text-sm text-destructive whitespace-pre-wrap">
                      {message.text}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setShowRawError(null)}
                    >
                      <Lightbulb className="w-3 h-3 mr-1" />
                      View Explanation
                    </Button>
                  </div>
                );
              }

              // Regular message or error without explanation
              return (
                <div 
                  key={index} 
                  className={`font-mono text-sm whitespace-pre-wrap ${outputStyle} ${
                    message.isError ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {message.text}
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
