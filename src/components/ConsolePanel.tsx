import React from "react";
import { Terminal, Trash2, Lightbulb, Code, ChevronDown, ChevronUp } from "lucide-react";
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ERROR_PATTERN = /(traceback|syntaxerror|typeerror|referenceerror|nameerror|modulenotfounderror|valueerror|indexerror|keyerror|attributeerror|exception|\berror\b|\bfailed\b|^✗)/i;
const WARNING_PATTERN = /(warning|warn:|⚠)/i;

function looksLikeError(message: ConsoleMessage) {
  return Boolean(message.isError || ERROR_PATTERN.test(message.text));
}

function localExplanation(text: string): ErrorExplanation {
  const lower = text.toLowerCase();

  if (lower.includes("syntaxerror") || lower.includes("syntax error")) {
    return {
      what: "The parser could not understand the code at or just before the reported location.",
      why: "A bracket, quote, comma, colon, keyword, or other piece of syntax is probably missing or misplaced.",
      fix: "Start at the first reported line. Check the line above it too, then match brackets/quotes and verify the language's required punctuation.",
      concepts: ["syntax", "parser", "line numbers"],
    };
  }

  if (lower.includes("nameerror") || lower.includes("referenceerror") || lower.includes("is not defined")) {
    return {
      what: "The code tried to use a name that does not exist in the current scope.",
      why: "The variable/function may be misspelled, declared later, or created in a different scope.",
      fix: "Check the exact spelling and casing, then make sure the value is defined before this line runs.",
      concepts: ["variables", "scope", "execution order"],
    };
  }

  if (lower.includes("modulenotfounderror") || lower.includes("cannot find module") || lower.includes("package") && lower.includes("not found")) {
    return {
      what: "The requested package or module is not available in this browser runtime.",
      why: "It may not be installed, may use native system code, or may not be compatible with the WebAssembly/browser environment.",
      fix: "Check the package name first. If it is valid, use the package manager when supported or choose a browser-compatible alternative.",
      concepts: ["packages", "browser runtime", "WebAssembly"],
    };
  }

  if (lower.includes("typeerror") || lower.includes("type error")) {
    return {
      what: "An operation received a value of the wrong type or shape.",
      why: "For example, code may be treating text like a number, calling something that is not a function, or reading a property from an invalid value.",
      fix: "Inspect the values used on the first reported line. Confirm their types and convert or guard them before the operation.",
      concepts: ["types", "values", "runtime errors"],
    };
  }

  if (lower.includes("indexerror") || lower.includes("out of range") || lower.includes("out of bounds")) {
    return {
      what: "The code tried to access an item outside the available range.",
      why: "The list/array/table has fewer items than the index being requested.",
      fix: "Check the collection length and the index calculation. Remember that many languages start indexing at 0.",
      concepts: ["indexes", "arrays", "bounds"],
    };
  }

  if (lower.includes("keyerror") || lower.includes("no such column") || lower.includes("unknown column")) {
    return {
      what: "The code requested a key or column that is not present.",
      why: "The name may be misspelled, have different casing/whitespace, or the loaded dataset may have a different schema.",
      fix: "Print or inspect the available keys/column names and use the exact value shown there.",
      concepts: ["keys", "columns", "schema"],
    };
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return {
      what: "The operation did not finish inside the allowed time.",
      why: "A runtime may still be loading, the code may be doing too much work, or a loop may not terminate.",
      fix: "Try a smaller input first. Check loops for a clear exit condition, then retry after the runtime reports that it is ready.",
      concepts: ["performance", "loops", "runtime initialization"],
    };
  }

  if (lower.includes("runtime not initialized") || lower.includes("failed to initialize")) {
    return {
      what: "The language engine was not ready when execution was requested.",
      why: "Browser runtimes such as Python/R/PHP/Ruby/Lua load separately and can fail because of network, memory, or compatibility limits.",
      fix: "Wait for the language status to show Ready and run again. If it keeps failing, reload the workspace and try a smaller example before loading packages.",
      concepts: ["runtime", "WebAssembly", "initialization"],
    };
  }

  return {
    what: "The runtime reported an execution error.",
    why: "The raw message usually contains the exception type, line, and the first useful clue about the failing operation.",
    fix: "Read from the first error line downward, fix the earliest reported problem, then run again. Use Raw Error below when you need the exact runtime message.",
    concepts: ["debugging", "runtime errors"],
  };
}

export const ConsolePanel = ({
  output,
  onClear,
  plainEnglishMode,
  onTogglePlainEnglish,
  hasNewOutput,
  isCollapsed,
  onToggleCollapse,
}: ConsolePanelProps) => {
  const [showRawError, setShowRawError] = React.useState<number | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isMobile = React.useMemo(
    () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    [],
  );

  React.useEffect(() => {
    if (isCollapsed) return;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ block: "end" });
    });
    return () => cancelAnimationFrame(frame);
  }, [output.length, isCollapsed]);

  const maxMessages = isMobile ? 300 : 1500;
  const startIndex = Math.max(0, output.length - maxMessages);
  const recentOutput = output.slice(startIndex);

  // Some runtimes currently resolve with an error instead of throwing. Until every
  // runtime is normalized, do not show a misleading success footer immediately
  // after an obvious error message.
  const displayedOutput = recentOutput.filter((message, index, list) => {
    if (!/execution completed\s*✓/i.test(message.text)) return true;
    return !list.slice(Math.max(0, index - 8), index).some(looksLikeError);
  });
  const latestAccessibleMessage = displayedOutput.at(-1)?.text || "";

  const getOutputStyle = (message: ConsoleMessage) => {
    if (looksLikeError(message)) return "border-l-4 border-l-destructive bg-destructive/5 pl-3 py-2";
    if (message.text.includes("✓") || message.text.toLowerCase().includes("success")) {
      return "border-l-4 border-l-green-500 bg-green-500/5 pl-3 py-2";
    }
    if (WARNING_PATTERN.test(message.text)) {
      return "border-l-4 border-l-yellow-500 bg-yellow-500/5 pl-3 py-2";
    }
    return "py-1";
  };

  if (isCollapsed) {
    return (
      <div className={`h-full bg-console border-t flex items-center justify-between px-4 transition-colors ${hasNewOutput ? "border-primary" : "border-border"}`}>
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Console</span>
          {output.length > 0 && <span className="text-xs text-muted-foreground">({output.length})</span>}
          {latestAccessibleMessage && <span className="sr-only" role="status" aria-live="polite">Latest console output: {latestAccessibleMessage}</span>}
        </div>
        {onToggleCollapse && (
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} title="Expand console" aria-label="Expand console">
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`h-full bg-console border-t flex flex-col transition-colors ${hasNewOutput ? "border-primary" : "border-border"}`}>
      <div className="flex items-center justify-between p-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground" id="console-heading">Console</h3>
          {plainEnglishMode && (
            <Badge variant="secondary" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" aria-hidden="true" />
              Plain English
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onTogglePlainEnglish}
            title={plainEnglishMode ? "Show raw errors" : "Explain errors in plain English"}
            aria-label={plainEnglishMode ? "Show raw console errors" : "Explain console errors in plain English"}
          >
            {plainEnglishMode ? <Code className="w-4 h-4" aria-hidden="true" /> : <Lightbulb className="w-4 h-4" aria-hidden="true" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClear} title="Clear console" aria-label="Clear console">
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
          {onToggleCollapse && (
            <Button variant="ghost" size="icon" onClick={onToggleCollapse} title="Collapse console" aria-label="Collapse console">
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div
          role="log"
          aria-labelledby="console-heading"
          aria-live="polite"
          aria-relevant="additions text"
          aria-atomic="false"
          tabIndex={0}
          className="min-h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          {output.length === 0 ? (
            <p className="text-sm text-muted-foreground">No output yet. Run your code to see results.</p>
          ) : (
            <>
              {output.length > maxMessages && (
                <div className="mb-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  Showing the newest {maxMessages.toLocaleString()} of {output.length.toLocaleString()} messages.
                </div>
              )}
              <div className="space-y-2">
                {displayedOutput.map((message, localIndex) => {
                  const stableIndex = startIndex + localIndex;
                  const effectiveError = looksLikeError(message);
                  const explanation = message.explanation || (effectiveError ? localExplanation(message.text) : undefined);
                  const explainedError = effectiveError && explanation && plainEnglishMode;
                  const showingRaw = showRawError === stableIndex;

                  if (explainedError && !showingRaw) {
                    return (
                      <div key={`${stableIndex}-${message.text}`} className="border border-primary/20 rounded-lg p-3 bg-card/50 space-y-2">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What happened</p>
                              <p className="text-sm text-foreground">{explanation.what}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Why</p>
                              <p className="text-sm text-foreground">{explanation.why}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Try this</p>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{explanation.fix}</p>
                            </div>
                            {explanation.concepts.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {explanation.concepts.map((concept) => (
                                  <Badge key={concept} variant="outline" className="text-xs">{concept}</Badge>
                                ))}
                              </div>
                            )}
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setShowRawError(stableIndex)}>
                              <Code className="w-3 h-3 mr-1" aria-hidden="true" />
                              View raw error
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (explainedError && showingRaw) {
                    return (
                      <div key={`${stableIndex}-${message.text}`} className="space-y-1">
                        <div className="font-mono text-sm text-destructive whitespace-pre-wrap break-words">{message.text}</div>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setShowRawError(null)}>
                          <Lightbulb className="w-3 h-3 mr-1" aria-hidden="true" />
                          View explanation
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`${stableIndex}-${message.text}`}
                      className={`font-mono text-sm whitespace-pre-wrap break-words ${getOutputStyle(message)} ${effectiveError ? "text-destructive" : "text-foreground"}`}
                    >
                      {message.text}
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};