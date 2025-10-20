import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CloudWorkspace {
  id: string;
  name: string;
  description?: string | null;
  files: any;
  active_file_id?: string | null;
  language: string;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useCloudWorkspace = () => {
  const { user, isGuest } = useAuth();
  const [workspaces, setWorkspaces] = useState<CloudWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load user's workspaces
  const loadWorkspaces = async () => {
    if (isGuest || !user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;
      setWorkspaces((data || []) as CloudWorkspace[]);
    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  // Save current workspace to cloud
  const saveWorkspace = async (
    name: string,
    files: any[],
    activeFileId: string | null,
    language: string,
    description?: string,
    workspaceId?: string
  ): Promise<string | null> => {
    if (isGuest || !user) {
      toast.error('Sign in to save workspaces to cloud');
      return null;
    }

    setIsSyncing(true);
    try {
      if (workspaceId) {
        // Update existing workspace
        const { error } = await supabase
          .from('workspaces')
          .update({
            name,
            description,
            files,
            active_file_id: activeFileId,
            language,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', workspaceId);

        if (error) throw error;
        toast.success('Workspace saved to cloud');
        await loadWorkspaces();
        return workspaceId;
      } else {
        // Create new workspace
        const { data, error } = await supabase
          .from('workspaces')
          .insert({
            user_id: user.id,
            name,
            description,
            files,
            active_file_id: activeFileId,
            language
          })
          .select()
          .single();

        if (error) throw error;
        toast.success('Workspace created and saved to cloud');
        await loadWorkspaces();
        return data.id;
      }
    } catch (error: any) {
      console.error('Error saving workspace:', error);
      toast.error('Failed to save workspace to cloud');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  // Load a specific workspace
  const loadWorkspace = async (workspaceId: string): Promise<CloudWorkspace | null> => {
    if (isGuest || !user) return null;

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (error) throw error;

      // Update last accessed time
      await supabase
        .from('workspaces')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', workspaceId);

      return data;
    } catch (error: any) {
      console.error('Error loading workspace:', error);
      toast.error('Failed to load workspace');
      return null;
    }
  };

  // Delete a workspace
  const deleteWorkspace = async (workspaceId: string) => {
    if (isGuest || !user) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;
      toast.success('Workspace deleted');
      await loadWorkspaces();
    } catch (error: any) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    }
  };

  // Auto-save current session
  const autoSaveSession = async (
    files: any[],
    activeFileId: string | null,
    language: string,
    currentWorkspaceId?: string
  ) => {
    if (isGuest || !user) return;

    const autoSaveName = `Auto-saved Session - ${new Date().toLocaleString()}`;
    await saveWorkspace(
      autoSaveName,
      files,
      activeFileId,
      language,
      'Automatically saved session',
      currentWorkspaceId
    );
  };

  useEffect(() => {
    if (!isGuest && user) {
      loadWorkspaces();
    }
  }, [user, isGuest]);

  return {
    workspaces,
    isLoading,
    isSyncing,
    loadWorkspaces,
    saveWorkspace,
    loadWorkspace,
    deleteWorkspace,
    autoSaveSession,
    isCloudEnabled: !isGuest && !!user
  };
};
