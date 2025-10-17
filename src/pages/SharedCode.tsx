import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Editor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Download, Eye, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SharedCodeData {
  code: string;
  language: string;
  file_name?: string;
  created_at: string;
  view_count: number;
}

export default function SharedCode() {
  const { shortId } = useParams<{ shortId: string }>();
  const [codeData, setCodeData] = useState<SharedCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchSharedCode = async () => {
      if (!shortId) return;

      try {
        const { data, error } = await supabase
          .from("shared_code")
          .select("code, language, file_name, created_at, view_count")
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
              Go to OpenIDE
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">
                  {codeData?.file_name || "Shared Code"}
                </h1>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">
                  {codeData?.language}
                </span>
              </div>
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
            
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Link to="/">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Open in IDE
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Code Editor */}
        <Card className="overflow-hidden">
          <Editor
            height="calc(100vh - 200px)"
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
        </Card>
      </div>
    </div>
  );
}
