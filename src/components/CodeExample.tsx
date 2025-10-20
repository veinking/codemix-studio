import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface CodeExampleProps {
  code: string;
  language: string;
  title?: string;
  explanation?: string;
}

export const CodeExample = ({ code, language, title, explanation }: CodeExampleProps) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const openInIDE = () => {
    const encoded = btoa(code);
    window.open(`/ide?code=${encoded}&lang=${language}`, '_blank');
  };

  return (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-medium">{title}</h4>}
      {explanation && <p className="text-xs text-muted-foreground">{explanation}</p>}
      
      <div className="relative">
        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border border-border">
          <code>{code}</code>
        </pre>
        
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 bg-background/80 hover:bg-background"
            onClick={copyToClipboard}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs bg-background/80 hover:bg-background"
            onClick={openInIDE}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Open
          </Button>
        </div>
      </div>
    </div>
  );
};
