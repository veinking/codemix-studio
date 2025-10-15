import { File, Folder, Upload, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageManager } from "@/components/PackageManager";
import { NewFileDialog } from "@/components/NewFileDialog";
import { cn } from "@/lib/utils";

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
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(e.target.files);
    }
  };

  return (
    <div className="h-full bg-sidebar-custom border-r border-border flex flex-col">
      <div className="p-3 border-b border-border space-y-2">
        <h2 className="text-sm font-semibold text-foreground mb-2">Explorer</h2>
        
        <NewFileDialog onCreateFile={onCreateFile} />
        
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
