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
    <div className="border border-border rounded-lg overflow-hidden bg-card mb-3 shadow-sm">
      {/* Cell Header - Optimized for Mobile */}
      <div className="flex items-center justify-between px-3 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          {cell.type === 'code' ? (
            <Code className={cn("text-primary", isMobile ? "w-5 h-5" : "w-4 h-4")} />
          ) : (
            <FileText className={cn("text-muted-foreground", isMobile ? "w-5 h-5" : "w-4 h-4")} />
          )}
          <span className={cn("font-medium text-muted-foreground uppercase", isMobile ? "text-sm" : "text-xs")}>
            {cell.type === 'code' ? `${language} Code` : 'Markdown'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {cell.type === 'code' && (
            <Button
              variant="ghost"
              size={isMobile ? "default" : "sm"}
              onClick={() => onRun(cell.id)}
              disabled={isRunning}
              className={cn(isMobile ? "h-9 w-9" : "h-7 px-2")}
            >
              <Play className={cn(isMobile ? "w-4 h-4" : "w-3 h-3")} />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size={isMobile ? "default" : "sm"}
            onClick={() => onMoveUp(cell.id)}
            disabled={!canMoveUp}
            className={cn(isMobile ? "h-9 w-9" : "h-7 px-2")}
          >
            <ChevronUp className={cn(isMobile ? "w-4 h-4" : "w-3 h-3")} />
          </Button>
          
          <Button
            variant="ghost"
            size={isMobile ? "default" : "sm"}
            onClick={() => onMoveDown(cell.id)}
            disabled={!canMoveDown}
            className={cn(isMobile ? "h-9 w-9" : "h-7 px-2")}
          >
            <ChevronDown className={cn(isMobile ? "w-4 h-4" : "w-3 h-3")} />
          </Button>
          
          <Button
            variant="ghost"
            size={isMobile ? "default" : "sm"}
            onClick={() => onDelete(cell.id)}
            className={cn(
              "text-destructive hover:text-destructive",
              isMobile ? "h-9 w-9" : "h-7 px-2"
            )}
          >
            <Trash2 className={cn(isMobile ? "w-4 h-4" : "w-3 h-3")} />
          </Button>
        </div>
      </div>

      {/* Cell Content */}
      <div className={cn("p-3", isMobile && "p-4")}>
        {cell.type === 'code' ? (
          <div className={cn(isMobile ? "min-h-[120px]" : "min-h-[100px]")}>
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
        <div className={cn(isMobile ? "px-4 pb-4" : "px-3 pb-3")}>
          <div className={cn(
            "rounded-md font-mono whitespace-pre-wrap",
            isMobile ? "p-4 text-base" : "p-3 text-sm",
            cell.isError ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted"
          )}>
            {cell.output}
          </div>
        </div>
      )}

      {/* Add Cell Buttons - Mobile Optimized */}
      <div className={cn(
        "flex items-center justify-center gap-2 border-t border-border/50 bg-muted/30",
        isMobile ? "px-4 py-3" : "px-3 py-2"
      )}>
        <Button
          variant="outline"
          size={isMobile ? "default" : "sm"}
          onClick={() => onAddBelow(cell.id, 'code')}
          className={cn(isMobile ? "h-10 px-4" : "h-7")}
        >
          <Plus className={cn(isMobile ? "w-4 h-4 mr-2" : "w-3 h-3 mr-1")} />
          Code
        </Button>
        <Button
          variant="outline"
          size={isMobile ? "default" : "sm"}
          onClick={() => onAddBelow(cell.id, 'markdown')}
          className={cn(isMobile ? "h-10 px-4" : "h-7")}
        >
          <Plus className={cn(isMobile ? "w-4 h-4 mr-2" : "w-3 h-3 mr-1")} />
          Markdown
        </Button>
      </div>
    </div>
  );
};
