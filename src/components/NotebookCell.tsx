import React, { useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Play, Trash2, Plus, ChevronUp, ChevronDown, Code, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface NotebookCellData {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: string;
  isError?: boolean;
}

interface NotebookCellProps {
  cell: NotebookCellData;
  language: 'python' | 'r' | 'javascript' | 'sql';
  isRunning: boolean;
  onRun: (cellId: string) => void;
  onDelete: (cellId: string) => void;
  onContentChange: (cellId: string, content: string) => void;
  onAddBelow: (cellId: string, type: 'code' | 'markdown') => void;
  onMoveUp: (cellId: string) => void;
  onMoveDown: (cellId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isMobile?: boolean;
}

export const NotebookCell: React.FC<NotebookCellProps> = ({
  cell,
  language,
  isRunning,
  onRun,
  onDelete,
  onContentChange,
  onAddBelow,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isMobile = false
}) => {
  const [isEditing, setIsEditing] = useState(cell.type === 'code' || cell.content === '');

  return (
    <div className={cn(
      "border border-border rounded-lg overflow-hidden bg-card shadow-sm",
      isMobile ? "mb-2" : "mb-3"
    )}>
      {/* Cell Header - Optimized for Mobile */}
      <div className={cn(
        "flex items-center justify-between bg-muted/50 border-b border-border",
        isMobile ? "px-2 py-2" : "px-3 py-3"
      )}>
        {!isMobile && (
          <div className="flex items-center gap-2">
            {cell.type === 'code' ? (
              <Code className="text-primary w-4 h-4" />
            ) : (
              <FileText className="text-muted-foreground w-4 h-4" />
            )}
            <span className="font-medium text-muted-foreground uppercase text-xs">
              {cell.type === 'code' ? `${language} Code` : 'Markdown'}
            </span>
          </div>
        )}
        {isMobile && <div />}

        <div className={cn("flex items-center", isMobile ? "gap-0.5" : "gap-1")}>
          {cell.type === 'code' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRun(cell.id)}
              disabled={isRunning}
              className={cn(isMobile ? "h-8 w-8 p-0" : "h-7 px-2")}
            >
              <Play className={cn(isMobile ? "w-3.5 h-3.5" : "w-3 h-3")} />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveUp(cell.id)}
            disabled={!canMoveUp}
            className={cn(isMobile ? "h-8 w-8 p-0" : "h-7 px-2")}
          >
            <ChevronUp className={cn(isMobile ? "w-3.5 h-3.5" : "w-3 h-3")} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveDown(cell.id)}
            disabled={!canMoveDown}
            className={cn(isMobile ? "h-8 w-8 p-0" : "h-7 px-2")}
          >
            <ChevronDown className={cn(isMobile ? "w-3.5 h-3.5" : "w-3 h-3")} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(cell.id)}
            className={cn(
              "text-destructive hover:text-destructive",
              isMobile ? "h-8 w-8 p-0" : "h-7 px-2"
            )}
          >
            <Trash2 className={cn(isMobile ? "w-3.5 h-3.5" : "w-3 h-3")} />
          </Button>
        </div>
      </div>

      {/* Cell Content */}
      <div className={cn("p-3", isMobile && "p-2")}>
        {cell.type === 'code' ? (
          <div className={cn(isMobile ? "h-[180px]" : "h-[200px]")}>
            <CodeEditor
              value={cell.content}
              language={language}
              onChange={(value) => onContentChange(cell.id, value || '')}
              isMobile={isMobile}
            />
          </div>
        ) : (
          <>
            {isEditing ? (
              <Textarea
                value={cell.content}
                onChange={(e) => onContentChange(cell.id, e.target.value)}
                onBlur={() => cell.content && setIsEditing(false)}
                placeholder="Write markdown here... (supports **bold**, _italic_, lists, etc.)"
                className={cn("font-mono", isMobile ? "min-h-[120px] text-base" : "min-h-[100px] text-sm")}
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className={cn(
                  "prose dark:prose-invert max-w-none cursor-pointer hover:bg-muted/30 rounded p-2",
                  isMobile ? "prose-base min-h-[80px]" : "prose-sm min-h-[60px]"
                )}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {cell.content || '*Click to edit markdown*'}
                </ReactMarkdown>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cell Output */}
      {cell.output && (
        <div className={cn(isMobile ? "px-2 pb-2" : "px-3 pb-3")}>
          <div className={cn(
            "rounded-md font-mono whitespace-pre-wrap",
            isMobile ? "p-2 text-sm" : "p-3 text-sm",
            cell.isError ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted"
          )}>
            {cell.output}
          </div>
        </div>
      )}

      {/* Add Cell Buttons - Hidden on mobile, shown at notebook end */}
      {!isMobile && (
        <div className="flex items-center justify-center gap-2 border-t border-border/50 bg-muted/30 px-3 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddBelow(cell.id, 'code')}
            className="h-7"
          >
            <Plus className="w-3 h-3 mr-1" />
            Code
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddBelow(cell.id, 'markdown')}
            className="h-7"
          >
            <Plus className="w-3 h-3 mr-1" />
            Markdown
          </Button>
        </div>
      )}
    </div>
  );
};
