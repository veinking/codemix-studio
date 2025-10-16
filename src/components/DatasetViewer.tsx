import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DatasetViewerProps {
  data: string[][];
  headers: string[];
}

export const DatasetViewer = ({ data, headers }: DatasetViewerProps) => {
  const [showAll, setShowAll] = useState(false);
  const PREVIEW_ROWS = 100;
  
  const displayData = showAll ? data : data.slice(0, PREVIEW_ROWS);
  const hasMore = data.length > PREVIEW_ROWS;
  
  return (
    <div className="h-full bg-editor border rounded flex flex-col">
      {/* Stats Header */}
      <div className="px-4 py-3 border-b border-border bg-toolbar flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="font-mono">
            {data.length} rows × {headers.length} cols
          </Badge>
          {hasMore && !showAll && (
            <span className="text-xs text-muted-foreground">
              Showing first {PREVIEW_ROWS} rows
            </span>
          )}
        </div>
        
        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? `Show Preview Only` : `Show All ${data.length} Rows`}
          </Button>
        )}
      </div>

      {/* Warning for large datasets */}
      {hasMore && showAll && (
        <Alert className="m-4 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Displaying {data.length} rows may impact performance on mobile devices.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Table */}
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
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} className="text-foreground">
                    {cell}
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
