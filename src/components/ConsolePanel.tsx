import { Terminal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConsolePanelProps {
  output: string[];
  onClear: () => void;
}

export const ConsolePanel = ({ output, onClear }: ConsolePanelProps) => {
  return (
    <div className="h-full bg-console border-t border-border flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Console</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClear}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        {output.length === 0 ? (
          <p className="text-sm text-muted-foreground">No output yet. Run your code to see results.</p>
        ) : (
          <div className="font-mono text-sm space-y-1">
            {output.map((line, index) => (
              <div key={index} className="text-foreground whitespace-pre-wrap">{line}</div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
