import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Variable, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VariableInfo {
  name: string;
  type: string;
  value: string;
  size?: string;
}

interface VariableInspectorProps {
  variables: VariableInfo[];
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const VariableInspector = ({
  variables,
  onRefresh,
  isRefreshing = false
}: VariableInspectorProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Variable className="w-4 h-4" />
            <CardTitle className="text-sm">Variables</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          {variables.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-8 px-4">
              No variables yet. Run code to see variables.
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {variables.map((variable, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-md hover:bg-accent/50 transition-colors border border-border/50"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {variable.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {variable.type}
                    </Badge>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground break-all">
                    {variable.value.length > 100 
                      ? variable.value.substring(0, 100) + '...' 
                      : variable.value}
                  </p>
                  {variable.size && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Size: {variable.size}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
