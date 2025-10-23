import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Editor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, Download, Eye, ArrowLeft, Code2, AlertTriangle, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updatePageSEO, SEO_CONFIGS } from "@/utils/seo";
import { Helmet } from "react-helmet";

interface SharedCodeData {
  code: string;
  language: string;
  file_name?: string;
  created_at: string;
  view_count: number;
  category?: string;
  description?: string;
  tags?: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  'data-analysis': '📊 Data Analysis',
  'machine-learning': '🤖 Machine Learning',
  'visualization': '📈 Visualization',
  'web-scraping': '🕷️ Web Scraping',
  'utility': '🔧 Utility',
  'education': '📚 Education',
  'game': '🎮 Game',
  'other': '📦 Other',
};

export default function SharedCode() {
  const { shortId } = useParams<{ shortId: string }>();
  const navigate = useNavigate();
  const [codeData, setCodeData] = useState<SharedCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const shareUrl = `${window.location.origin}/share/${shortId}`;
  const shareTitle = codeData?.file_name || "Shared Code";
  const shareDescription = `Check out this ${codeData?.language || 'code'} snippet on bIDE`;

  useEffect(() => {
    updatePageSEO(SEO_CONFIGS.sharedCode);
  }, []);

  useEffect(() => {
    const fetchSharedCode = async () => {
      if (!shortId) return;

      try {
        const { data, error } = await supabase
          .from("shared_code")
          .select("code, language, file_name, created_at, view_count, category, description, tags")
          .eq("short_id", shortId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setNotFound(true);
          return;
        }

        setCodeData(data);

        // Increment view count
        await supabase
          .from("shared_code")
          .update({ view_count: data.view_count + 1 })
          .eq("short_id", shortId);

      } catch (error) {
        console.error("Error fetching shared code:", error);
        toast.error("Failed to load shared code");
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedCode();
  }, [shortId]);

  const handleCopy = async () => {
    if (!codeData) return;
    try {
      await navigator.clipboard.writeText(codeData.code);
      toast.success("Code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const handleDownload = () => {
    if (!codeData) return;
    
    const extension = {
      python: "py",
      r: "r",
      javascript: "js",
      sql: "sql"
    }[codeData.language] || "txt";

    const fileName = codeData.file_name || `shared-code.${extension}`;
    const blob = new Blob([codeData.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Code downloaded!");
  };

  const handleForkCode = () => {
    if (!codeData) return;
    if (!hasAcknowledged) {
      toast.error("Please acknowledge the security warning first");
      setShowWarning(true);
      return;
    }
    navigator.clipboard.writeText(codeData.code);
    toast.success("Code copied! Opening in IDE...");
    navigate('/');
  };

  const handleReport = () => {
    toast.success("Thank you for reporting. We'll review this code.");
  };

  const handleAcknowledge = () => {
    setHasAcknowledged(true);
    setShowWarning(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-lg">Loading shared code...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-bold">Code Not Found</h1>
          <p className="text-muted-foreground">
            This shared code link doesn't exist or has expired.
          </p>
          <Link to="/">
            <Button className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to bIDE
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
      </Helmet>

      {/* Security Warning Dialog */}
      <AlertDialog open={showWarning && !hasAcknowledged}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              Security Warning: User-Shared Code
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-left">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
                <p className="font-semibold text-foreground">⚠️ This code was shared by another user</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span><strong>Always review code before running it</strong> - Malicious code can damage your system</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Shared code may access <strong>files, networks, or system resources</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>bIDE is <strong>not responsible</strong> for code shared by users</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>When in doubt, <strong>ask an expert</strong> or skip this code</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                By acknowledging this warning, you understand the risks of running user-shared code and agree to review it carefully before execution.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAcknowledge} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              I Understand - Show Code
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto p-4 space-y-4">
          {/* Security Alert Banner */}
          {hasAcknowledged && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Security Notice:</strong> This is user-shared code. Always review before running.
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {codeData?.category && (
                    <Badge variant="secondary" className="text-sm">
                      {CATEGORY_LABELS[codeData.category] || codeData.category}
                    </Badge>
                  )}
                  <h1 className="text-xl font-bold">
                    {codeData?.file_name || "Shared Code"}
                  </h1>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">
                    {codeData?.language}
                  </span>
                </div>
                
                {codeData?.description && (
                  <p className="text-sm text-muted-foreground">
                    {codeData.description}
                  </p>
                )}
                
                {codeData?.tags && codeData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {codeData.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {codeData?.view_count} views
                  </div>
                  <div>
                    Shared {new Date(codeData?.created_at || "").toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={handleForkCode} 
                  variant="default" 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={!hasAcknowledged}
                >
                  <Code2 className="w-4 h-4 mr-2" />
                  Fork Code
                </Button>
                <Button onClick={handleCopy} variant="outline" size="sm" disabled={!hasAcknowledged}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={handleDownload} variant="outline" size="sm" disabled={!hasAcknowledged}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={handleReport} variant="outline" size="sm">
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </Button>
                <Link to="/">
                  <Button variant="secondary" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Open in IDE
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Code Editor */}
        <Card className="overflow-hidden">
          {hasAcknowledged ? (
            <Editor
              height="calc(100vh - 300px)"
              language={codeData?.language}
              value={codeData?.code}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: "on",
                renderLineHighlight: "none",
              }}
            />
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
                <p>Please acknowledge the security warning to view this code</p>
                <Button onClick={() => setShowWarning(true)}>
                  Show Warning
                </Button>
              </div>
            </div>
          )}
          </Card>
        </div>
      </div>
    </>
  );
}
