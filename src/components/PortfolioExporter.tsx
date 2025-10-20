import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Eye } from "lucide-react";
import { generatePortfolioHTML, downloadPortfolio, PortfolioOptions } from "@/utils/portfolioExporter";
import { toast } from "sonner";

interface FileItem {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface Dataset {
  headers: string[];
  data: string[][];
}

interface PortfolioExporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileItem[];
  datasets: Map<string, Dataset>;
  plots: string | null;
  consoleOutput: Array<{ text: string }>;
}

export const PortfolioExporter = ({
  open,
  onOpenChange,
  files,
  datasets,
  plots,
  consoleOutput,
}: PortfolioExporterProps) => {
  const [options, setOptions] = useState<PortfolioOptions>({
    title: "My bIDE Project",
    description: "A project created with bIDE",
    author: "",
    includeCode: true,
    includeDatasets: true,
    includePlots: true,
    includeOutput: true,
    theme: 'light',
  });

  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const handleGeneratePreview = () => {
    const html = generatePortfolioHTML(files, datasets, plots, consoleOutput, options);
    setPreviewHtml(html);
    setShowPreview(true);
    toast.success("Preview generated");
  };

  const handleDownload = () => {
    const html = generatePortfolioHTML(files, datasets, plots, consoleOutput, options);
    const filename = options.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    downloadPortfolio(html, filename);
    toast.success(`Downloaded ${filename}.html`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Portfolio</DialogTitle>
          <DialogDescription>
            Create a beautiful HTML page showcasing your project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={options.title}
              onChange={(e) => setOptions({ ...options, title: e.target.value })}
              placeholder="My Amazing Project"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={options.description}
              onChange={(e) => setOptions({ ...options, description: e.target.value })}
              placeholder="Brief description of your project..."
              rows={3}
            />
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">Author Name</Label>
            <Input
              id="author"
              value={options.author}
              onChange={(e) => setOptions({ ...options, author: e.target.value })}
              placeholder="Your name"
            />
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={options.theme}
              onValueChange={(value: 'light' | 'dark' | 'auto') => 
                setOptions({ ...options, theme: value })
              }
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include options */}
          <div className="space-y-3 pt-4 border-t">
            <Label>Include in Portfolio</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCode"
                checked={options.includeCode}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, includeCode: checked as boolean })
                }
              />
              <label htmlFor="includeCode" className="text-sm font-medium cursor-pointer">
                Source Code ({files.filter(f => f.language !== 'csv').length} files)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDatasets"
                checked={options.includeDatasets}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, includeDatasets: checked as boolean })
                }
                disabled={datasets.size === 0}
              />
              <label htmlFor="includeDatasets" className="text-sm font-medium cursor-pointer">
                Datasets ({datasets.size} datasets)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePlots"
                checked={options.includePlots}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, includePlots: checked as boolean })
                }
                disabled={!plots}
              />
              <label htmlFor="includePlots" className="text-sm font-medium cursor-pointer">
                Visualizations {plots ? '(1 plot)' : '(no plots)'}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeOutput"
                checked={options.includeOutput}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, includeOutput: checked as boolean })
                }
                disabled={consoleOutput.length === 0}
              />
              <label htmlFor="includeOutput" className="text-sm font-medium cursor-pointer">
                Console Output ({consoleOutput.length} lines)
              </label>
            </div>
          </div>

          {/* Preview */}
          {showPreview && previewHtml && (
            <div className="border rounded-lg p-4 bg-muted">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <iframe
                srcDoc={previewHtml}
                className="w-full h-96 border rounded bg-background"
                title="Portfolio Preview"
                sandbox="allow-scripts"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleGeneratePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download HTML
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
