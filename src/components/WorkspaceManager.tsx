import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCloudWorkspace, CloudWorkspace, CloudWorkspaceFile } from '@/hooks/useCloudWorkspace';
import { Cloud, CloudOff, Plus, Trash2, Download, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface WorkspaceManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFiles: CloudWorkspaceFile[];
  currentActiveFileId: string | null;
  currentLanguage: string;
  currentScratchCode: string;
  onLoadWorkspace: (workspace: CloudWorkspace) => Promise<boolean>;
}

export const WorkspaceManager = ({
  open,
  onOpenChange,
  currentFiles,
  currentActiveFileId,
  currentLanguage,
  currentScratchCode,
  onLoadWorkspace
}: WorkspaceManagerProps) => {
  const {
    workspaces,
    isLoading,
    isSyncing,
    saveWorkspace,
    loadWorkspace,
    deleteWorkspace,
    isCloudEnabled
  } = useCloudWorkspace();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [loadingWorkspaceId, setLoadingWorkspaceId] = useState<string | null>(null);

  const handleSaveCurrentWorkspace = async () => {
    if (!workspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    const id = await saveWorkspace(
      workspaceName,
      currentFiles,
      currentActiveFileId,
      currentLanguage,
      currentScratchCode,
      workspaceDescription
    );

    if (id) {
      setShowSaveDialog(false);
      setWorkspaceName('');
      setWorkspaceDescription('');
    }
  };

  const handleLoadWorkspace = async (workspaceId: string) => {
    setLoadingWorkspaceId(workspaceId);
    try {
      const workspace = await loadWorkspace(workspaceId);
      if (!workspace) return;

      const loaded = await onLoadWorkspace(workspace);
      if (!loaded) return;

      onOpenChange(false);
      toast.success(`Workspace "${workspace.name}" restored locally`);
    } finally {
      setLoadingWorkspaceId(null);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string, name: string) => {
    if (confirm(`Delete workspace "${name}"? This cannot be undone.`)) {
      await deleteWorkspace(workspaceId);
    }
  };

  if (!isCloudEnabled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CloudOff className="h-5 w-5" />
              Cloud Workspaces
            </DialogTitle>
            <DialogDescription>
              Sign in to save workspace snapshots and reopen them on another device
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <CloudOff className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Cloud workspace snapshots require a free account
            </p>
            <Button asChild>
              <Link to="/auth" onClick={() => onOpenChange(false)}>
                Sign In to Enable Cloud Workspaces
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Cloud className="h-6 w-6 text-primary" />
              Cloud Workspaces
            </DialogTitle>
            <DialogDescription>
              Save a workspace snapshot, then restore that exact session on this or another device
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button onClick={() => setShowSaveDialog(true)} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Save Current Workspace
            </Button>
          </div>

          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : workspaces.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Cloud className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No saved workspaces yet</p>
                <p className="text-sm">Save your current session to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {workspaces.map(workspace => (
                  <Card key={workspace.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-start justify-between">
                        <span className="flex-1">{workspace.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWorkspace(workspace.id, workspace.name)}
                          aria-label={`Delete ${workspace.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </CardTitle>
                      {workspace.description && (
                        <CardDescription>{workspace.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Last opened {formatDistanceToNow(new Date(workspace.last_accessed_at), { addSuffix: true })}
                        </div>
                        <div>
                          Scratch language: <span className="font-semibold">{workspace.language}</span>
                        </div>
                        <div>
                          Files: <span className="font-semibold">{workspace.files.length}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleLoadWorkspace(workspace.id)}
                        className="w-full"
                        variant="secondary"
                        disabled={loadingWorkspaceId !== null}
                      >
                        {loadingWorkspaceId === workspace.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Restore Workspace
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {isSyncing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving cloud snapshot...
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Workspace Snapshot</DialogTitle>
            <DialogDescription>
              Save your files, active file, scratch editor and language to the cloud
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="workspace-name">Workspace Name *</Label>
              <Input
                id="workspace-name"
                placeholder="e.g., Data Analysis Project"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="workspace-description">Description (optional)</Label>
              <Textarea
                id="workspace-description"
                placeholder="Describe what you're working on..."
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              This snapshot includes {currentFiles.length} file(s), your scratch editor, and the current scratch language ({currentLanguage}). Cloud snapshots support up to 100 files / 5 MB of file JSON.
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCurrentWorkspace} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 mr-2" />
                    Save Snapshot
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
