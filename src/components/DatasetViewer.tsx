import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DatasetViewerProps {
  data: string[][];
  headers: string[];
}

export const DatasetViewer = ({ data, headers }: DatasetViewerProps) => {
  const displayLimit = 200;
  const displayData = useMemo(() => data.slice(0, displayLimit), [data]);
  
  return (
    <div className="h-full bg-editor border rounded flex flex-col">
      {/* Stats Header */}
      <div className="px-4 py-3 border-b border-border bg-toolbar flex items-center justify-between">
        <Badge variant="secondary" className="font-mono">
          {data.length.toLocaleString()} rows × {headers.length} cols
          {data.length > displayLimit && ` (showing first ${displayLimit})`}
        </Badge>
      </div>
      
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
                  <TableCell key={cellIndex} className="text-foreground whitespace-nowrap">
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
