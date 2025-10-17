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
    <div className="border border-border rounded-lg overflow-hidden bg-card mb-4">
      {/* Cell Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          {cell.type === 'code' ? (
            <Code className="w-4 h-4 text-primary" />
          ) : (
            <FileText className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {cell.type === 'code' ? `${language} Code` : 'Markdown'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {cell.type === 'code' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRun(cell.id)}
              disabled={isRunning}
              className="h-7 px-2"
            >
              <Play className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveUp(cell.id)}
            disabled={!canMoveUp}
            className="h-7 px-2"
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveDown(cell.id)}
            disabled={!canMoveDown}
            className="h-7 px-2"
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(cell.id)}
            className="h-7 px-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Cell Content */}
      <div className="p-3">
        {cell.type === 'code' ? (
          <div className="min-h-[100px]">
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
                className="min-h-[100px] font-mono text-sm"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="prose prose-sm dark:prose-invert max-w-none cursor-pointer hover:bg-muted/30 rounded p-2 min-h-[60px]"
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
        <div className="px-3 pb-3">
          <div className={cn(
            "p-3 rounded-md font-mono text-sm whitespace-pre-wrap",
            cell.isError ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted"
          )}>
            {cell.output}
          </div>
        </div>
      )}

      {/* Add Cell Buttons */}
      <div className="flex items-center justify-center gap-2 px-3 pb-3">
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
    </div>
  );
};
