import { useEffect, useRef, useState } from "react";
import { X, AlertCircle, Download, ZoomIn, ZoomOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface PlotViewerProps {
  plotData: string | null;
  onClose: () => void;
  plotCode?: string;
}

export const PlotViewer = ({ plotData, onClose, plotCode }: PlotViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!plotData) return;
    
    setIsLoading(true);
    setError(null);

    // Check for error messages in plot data
    if (plotData.includes('⚠️') || plotData.includes('Plot created but couldn\'t capture')) {
      setError('Plot code executed successfully, but image capture failed on this device.');
      setIsLoading(false);
      return;
    }

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
            setIsLoading(false);
          }
        }
      };
      img.onerror = () => {
        setError('Failed to load plot image. The code is valid but rendering failed on this device.');
        setIsLoading(false);
      };
      img.src = plotData;
    } else {
      setIsLoading(false);
    }
  }, [plotData]);

  const handleDownloadCode = () => {
    if (!plotCode) return;
    const blob = new Blob([plotCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plot_code.py';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Plot code downloaded!');
  };

  const handleDownloadImage = () => {
    if (!plotData || !plotData.startsWith('data:image')) return;
    
    try {
      // Convert base64 to blob
      const base64Data = plotData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plot_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Plot image downloaded!');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download plot image');
    }
  };

  const handleOpenInNewTab = () => {
    if (!plotData || !plotData.startsWith('data:image')) return;
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${plotData}" style="max-width:100%; height:auto;" />`);
      win.document.title = 'Plot';
    }
  };

  if (!plotData) return null;

  return (
    <div 
      className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-border shrink-0">
          <h3 className="font-semibold text-foreground">Plot Output</h3>
          <div className="flex gap-2">
            {plotData?.startsWith('data:image') && !error && (
              <>
                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Tab
                </Button>
              </>
            )}
            {plotCode && (
              <Button variant="outline" size="sm" onClick={handleDownloadCode}>
                <Download className="w-4 h-4 mr-2" />
                Download Code
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 md:p-6">
            {isLoading && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
                <p>Rendering plot...</p>
              </div>
            )}
            
            {error ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">{error}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    💡 The plot code is valid and has been generated successfully. 
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {plotData?.startsWith('data:image') && (
                      <Button onClick={handleDownloadImage} variant="default" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download Plot Image
                      </Button>
                    )}
                    {plotCode && (
                      <Button onClick={handleDownloadCode} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download Code
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {plotData?.startsWith('data:image') && !isLoading && (
                  <div className="flex justify-center overflow-auto">
                    <canvas 
                      ref={canvasRef} 
                      className="max-w-full h-auto rounded border border-border" 
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                    />
                  </div>
                )}
                {plotData && !plotData.startsWith('data:image') && !isLoading && (
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
