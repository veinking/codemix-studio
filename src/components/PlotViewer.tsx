import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlotViewerProps {
  plotData: string | null;
  onClose: () => void;
}

export const PlotViewer = ({ plotData, onClose }: PlotViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!plotData || !canvasRef.current) return;

    // If it's a data URL (matplotlib), draw it
    if (plotData.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
        }
      };
      img.src = plotData;
    }
  }, [plotData]);

  if (!plotData) return null;

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-5xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Plot Output</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4">
          {plotData.startsWith('data:image') ? (
            <canvas ref={canvasRef} className="max-w-full" />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: plotData }} />
          )}
        </div>
      </div>
    </div>
  );
};
