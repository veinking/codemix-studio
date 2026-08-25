import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, FilePlus2, Code2 } from "lucide-react";

interface DatasetViewerProps {
  data: string[][];
  headers: string[];
  title?: string;
  onVisualize?: () => void;
  onExportCSV?: () => void;
  onSaveAsFile?: () => void;
  onClose?: () => void;
}

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
          <Button size="sm" variant="outline" onClick={onClose}>
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
