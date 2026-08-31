import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, FilePlus2, Code2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { sendDatasetToPocketBI } from "@/lib/pocketBIOutboundHandoff";

interface DatasetViewerProps {
  data: string[][];
  headers: string[];
  title?: string;
  onVisualize?: () => void;
  onExportCSV?: () => void;
  onSaveAsFile?: () => void;
  onClose?: () => void;
}

const LAST_RUN_CONTEXT_KEY = "bide.last-run-context.v1";
const RESTORE_SOURCE_EVENT = "bide:restore-source-file";

export const DatasetViewer = ({
  data,
  headers,
  title,
  onVisualize,
  onExportCSV,
  onSaveAsFile,
  onClose,
}: DatasetViewerProps) => {
  const displayLimit = 200;
  const displayData = useMemo(() => data.slice(0, displayLimit), [data]);
  const [sendingToPocketBI, setSendingToPocketBI] = useState(false);

  const continueInPocketBI = async () => {
    if (!headers.length) {
      toast.error("This dataset has no columns to send to PocketBI.");
      return;
    }
    setSendingToPocketBI(true);
    try {
      const result = await sendDatasetToPocketBI({
        title: title || "bIDE result",
        headers,
        data,
      });
      if (result.warning) toast.warning(result.warning);
      toast.success(
        `Sent ${result.rowCount.toLocaleString()} rows × ${result.columnCount.toLocaleString()} columns to PocketBI${result.manifestAccepted ? " with lineage" : ""}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "bIDE could not hand this dataset to PocketBI.");
    } finally {
      setSendingToPocketBI(false);
    }
  };

  const returnToCode = () => {
    onClose?.();
    if (!/^SQL Result(?:\s+\d+)?$/i.test(String(title || "").trim())) return;

    try {
      const raw = sessionStorage.getItem(LAST_RUN_CONTEXT_KEY);
      if (!raw) return;
      const context = JSON.parse(raw) as { version?: number; fileId?: string | null; language?: string };
      if (context.version !== 1) return;
      if (context.language && ["python", "r", "javascript", "sql"].includes(context.language)) {
        sessionStorage.setItem("scratchLanguage", context.language);
      }
      if (context.fileId) {
        window.dispatchEvent(new CustomEvent(RESTORE_SOURCE_EVENT, {
          detail: { fileId: context.fileId },
        }));
      }
      sessionStorage.removeItem(LAST_RUN_CONTEXT_KEY);
    } catch {
      sessionStorage.removeItem(LAST_RUN_CONTEXT_KEY);
    }
  };

  return (
    <div className="h-full bg-editor border rounded flex flex-col">
      <div className="px-3 py-2 border-b border-border bg-toolbar flex flex-wrap items-center gap-2">
        <div className="min-w-0 mr-auto">
          {title && <div className="text-sm font-medium truncate">{title}</div>}
          <Badge variant="secondary" className="font-mono mt-1">
            {data.length.toLocaleString()} rows × {headers.length} cols
            {data.length > displayLimit && ` (showing first ${displayLimit})`}
          </Badge>
        </div>

        {onClose && (
          <Button size="sm" variant="outline" onClick={returnToCode}>
            <Code2 className="w-4 h-4 mr-2" />
            Back to Code
          </Button>
        )}
        {onSaveAsFile && (
          <Button size="sm" variant="outline" onClick={onSaveAsFile}>
            <FilePlus2 className="w-4 h-4 mr-2" />
            Save to Files
          </Button>
        )}
        {onExportCSV && (
          <Button size="sm" variant="outline" onClick={onExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={sendingToPocketBI || !headers.length}
          onClick={() => void continueInPocketBI()}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {sendingToPocketBI ? "Sending…" : "Continue in PocketBI"}
        </Button>
        {onVisualize && (
          <Button size="sm" variant="default" onClick={onVisualize}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Visualize
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index} className="text-foreground font-semibold">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((_, cellIndex) => (
                  <TableCell key={cellIndex} className="text-foreground whitespace-nowrap">
                    {row[cellIndex] ?? ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};