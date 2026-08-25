import { useEffect, useState } from "react";
import { X, AlertCircle, Download, ZoomIn, ZoomOut, ExternalLink, ImageDown } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!plotData) return;

    setError(null);
    setZoom(1);

    if (plotData.includes('⚠️') || plotData.includes('Plot created but couldn\'t capture')) {
      setError('Plot rendering failed inside bIDE. Close the viewer and run the code again.');
      setIsLoading(false);
      return;
    }

    // Raster plot images handle their own loading state via <img onLoad/onError>.
    // Non-image plot payloads render immediately as HTML.
    setIsLoading(plotData.startsWith('data:image'));
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
      const [header, base64Data] = plotData.split(',');
      const mimeMatch = header.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64$/);
      const mimeType = mimeMatch?.[1] || 'image/png';
      const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plot_${Date.now()}.${extension}`;
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

  const isImagePlot = plotData.startsWith('data:image');

  return (
    <div
      className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3 p-3 md:p-4 border-b border-border shrink-0 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-foreground shrink-0">Plot Output</h3>
          <div className="flex flex-wrap gap-2">
            {isImagePlot && !error && (
              <>
                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} aria-label="Zoom out">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.25))} aria-label="Zoom in">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Tab
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadImage}>
                  <ImageDown className="w-4 h-4 mr-2" />
                  Download Plot
                </Button>
              </>
            )}
            {plotCode && (
              <Button variant="outline" size="sm" onClick={handleDownloadCode}>
                <Download className="w-4 h-4 mr-2" />
                Download Code
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close plot viewer">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 md:p-6">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">{error}</p>
                  <p className="text-sm mb-3">
                    bIDE is expected to render supported Python plots in-browser. You can:
                  </p>
                  <ul className="text-sm space-y-1 mb-3 list-disc list-inside">
                    <li>Close the Plot Viewer and run the code again</li>
                    <li>Try a simpler chart if the figure is unusually large or complex</li>
                    <li>Download the code as a backup or to share it</li>
                  </ul>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {plotCode && (
                      <Button onClick={handleDownloadCode} variant="default" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download Code
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {isImagePlot && (
                  <div className="relative flex min-h-48 justify-center overflow-auto">
                    {isLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
                        <p>Rendering plot...</p>
                      </div>
                    )}
                    <img
                      src={plotData}
                      alt="Python plot output"
                      onLoad={() => setIsLoading(false)}
                      onError={() => {
                        setError('Failed to render the plot image in bIDE. Close the viewer and run the code again.');
                        setIsLoading(false);
                      }}
                      className={`max-w-full h-auto rounded border border-border transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                    />
                  </div>
                )}
                {!isImagePlot && !isLoading && (
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
