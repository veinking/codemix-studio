import { useEffect, useRef, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PlotViewerProps {
  plotData: string | null;
  onClose: () => void;
}

export const PlotViewer = ({ plotData, onClose }: PlotViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plotData || !canvasRef.current) return;

    // If it's a data URL (matplotlib), draw it
    if (plotData.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          }
        }
      };
      img.onerror = () => {
        setError('Failed to load plot image');
      };
      img.src = plotData;
    }
  }, [plotData]);

  if (!plotData) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-border shrink-0">
          <h3 className="font-semibold text-foreground">Plot Output</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 md:p-6">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                {plotData.startsWith('data:image') ? (
                  <div className="flex justify-center">
                    <canvas ref={canvasRef} className="max-w-full h-auto" />
                  </div>
                ) : (
                  <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: plotData }} 
                  />
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
