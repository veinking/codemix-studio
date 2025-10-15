import { File, Folder, Upload, Trash2, Save, FilePlus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageManager } from "@/components/PackageManager";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
}

interface FileExplorerProps {
  files: FileItem[];
  activeFile: string | null;
  onFileSelect: (fileId: string) => void;
  onFileUpload: (files: FileList) => void;
  onFileDelete: (fileId: string) => void;
  onCreateFile: (name: string, content: string) => void;
  onSaveAll: () => void;
  installedPackages: string[];
  onInstallPackage: (packageName: string) => Promise<void>;
  isInstalling: boolean;
}

const FILE_TEMPLATES = {
  python: { extension: '.py', template: '# Python Script\n\nprint("Hello, World!")\n' },
  r: { extension: '.r', template: '# R Script\n\nprint("Hello, World!")\n' },
  rmarkdown: { extension: '.rmd', template: `---\ntitle: "Untitled"\noutput: html_document\n---\n\n\`\`\`{r setup, include=FALSE}\nknitr::opts_chunk$set(echo = TRUE)\n\`\`\`\n\n## R Markdown Document\n` },
  text: { extension: '.txt', template: '' },
};

export const FileExplorer = ({
  files,
  activeFile,
  onFileSelect,
  onFileUpload,
  onFileDelete,
  onCreateFile,
  onSaveAll,
  installedPackages,
  onInstallPackage,
  isInstalling,
}: FileExplorerProps) => {
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<keyof typeof FILE_TEMPLATES>("python");

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(e.target.files);
    }
  };

  const handleCreateFile = () => {
    if (!fileName.trim()) return;
    const template = FILE_TEMPLATES[fileType];
    const fullName = fileName.includes('.') ? fileName : fileName + template.extension;
    onCreateFile(fullName, template.template);
    setFileName("");
    setFileType("python");
    setNewFileOpen(false);
  };

  return (
    <div className="h-full bg-sidebar-custom border-r border-border flex flex-col">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-3">Explorer</h2>
        
        <div className="space-y-2">
          <Collapsible open={newFileOpen} onOpenChange={setNewFileOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="secondary" className="w-full justify-between">
                <span className="flex items-center">
                  <FilePlus className="w-4 h-4 mr-2" />
                  New File
                </span>
                {newFileOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2 p-3 bg-background/50 rounded-md border border-border">
              <div className="grid gap-2">
                <Label htmlFor="file-type" className="text-xs">File Type</Label>
                <Select value={fileType} onValueChange={(value) => setFileType(value as keyof typeof FILE_TEMPLATES)}>
                  <SelectTrigger id="file-type" className="h-9">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="python">Python (.py)</SelectItem>
                    <SelectItem value="r">R Script (.r)</SelectItem>
                    <SelectItem value="rmarkdown">R Markdown (.rmd)</SelectItem>
                    <SelectItem value="text">Text File (.txt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file-name" className="text-xs">File Name</Label>
                <Input
                  id="file-name"
                  placeholder="script"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                  className="h-9"
                />
              </div>
              <Button onClick={handleCreateFile} disabled={!fileName.trim()} className="w-full" size="sm">
                Create File
              </Button>
            </CollapsibleContent>
          </Collapsible>
          
          <label htmlFor="file-upload">
            <Button variant="secondary" className="w-full" asChild>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".py,.r,.rmd,.csv,.txt"
            className="hidden"
            onChange={handleFileInput}
          />
          
          <Button variant="secondary" className="w-full" onClick={onSaveAll}>
            <Save className="w-4 h-4 mr-2" />
            Save All
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">No files yet</p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded hover:bg-secondary cursor-pointer group",
                  activeFile === file.id && "bg-secondary"
                )}
                onClick={() => onFileSelect(file.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {file.type === 'folder' ? (
                    <Folder className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-sm text-foreground truncate">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileDelete(file.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <PackageManager
        installedPackages={installedPackages}
        onInstallPackage={onInstallPackage}
        isInstalling={isInstalling}
      />
    </div>
  );
};
