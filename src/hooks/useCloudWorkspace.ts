import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type WorkspaceLanguage = 'python' | 'r' | 'javascript' | 'sql';
export type WorkspaceFileLanguage = WorkspaceLanguage | 'csv' | 'plaintext';

export interface CloudWorkspaceFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content: string;
  language: WorkspaceFileLanguage;
}

export interface CloudWorkspace {
  id: string;
  name: string;
  description?: string | null;
  files: CloudWorkspaceFile[];
  active_file_id?: string | null;
  language: WorkspaceLanguage;
  scratch_code: string;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const WORKSPACE_FILE_LIMIT = 100;
const WORKSPACE_JSON_LIMIT_BYTES = 5 * 1024 * 1024;
const SCRATCH_LIMIT_BYTES = 1024 * 1024;
const WORKSPACE_LANGUAGES = new Set<WorkspaceLanguage>(['python', 'r', 'javascript', 'sql']);
const FILE_LANGUAGES = new Set<WorkspaceFileLanguage>(['python', 'r', 'javascript', 'sql', 'csv', 'plaintext']);

const utf8Bytes = (value: string) => new TextEncoder().encode(value).byteLength;

const isWorkspaceFile = (value: unknown): value is CloudWorkspaceFile => {
  if (!value || typeof value !== 'object') return false;
  const file = value as Record<string, unknown>;
  return typeof file.id === 'string'
    && typeof file.name === 'string'
    && (file.type === 'file' || file.type === 'folder')
    && typeof file.content === 'string'
    && typeof file.language === 'string'
    && FILE_LANGUAGES.has(file.language as WorkspaceFileLanguage);
};

const normalizeWorkspace = (value: any): CloudWorkspace | null => {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.id !== 'string' || typeof value.user_id !== 'string') return null;
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 100) return null;
  if (!WORKSPACE_LANGUAGES.has(value.language as WorkspaceLanguage)) return null;
  if (!Array.isArray(value.files) || value.files.length > WORKSPACE_FILE_LIMIT || !value.files.every(isWorkspaceFile)) return null;

  const ids = new Set(value.files.map((file: CloudWorkspaceFile) => file.id));
  const activeFileId = typeof value.active_file_id === 'string' && ids.has(value.active_file_id)
    ? value.active_file_id
    : null;

  return {
    id: value.id,
    user_id: value.user_id,
    name: value.name.trim(),
    description: typeof value.description === 'string' ? value.description : null,
    files: value.files,
    active_file_id: activeFileId,
    language: value.language as WorkspaceLanguage,
    scratch_code: typeof value.scratch_code === 'string' ? value.scratch_code : '',
    last_accessed_at: value.last_accessed_at,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
};

const validateSnapshot = (
  name: string,
  files: CloudWorkspaceFile[],
  language: string,
  scratchCode: string,
  description?: string,
): string | null => {
  const trimmedName = name.trim();
  if (!trimmedName) return 'Please enter a workspace name';
  if (trimmedName.length > 100) return 'Workspace names are limited to 100 characters';
  if (description && description.length > 500) return 'Workspace descriptions are limited to 500 characters';
  if (!WORKSPACE_LANGUAGES.has(language as WorkspaceLanguage)) return 'Unsupported workspace language';
  if (files.length > WORKSPACE_FILE_LIMIT) return `Cloud workspaces support up to ${WORKSPACE_FILE_LIMIT} files`;
  if (!files.every(isWorkspaceFile)) return 'One or more workspace files are invalid';

  const uniqueIds = new Set(files.map(file => file.id));
  if (uniqueIds.size !== files.length) return 'Workspace contains duplicate file identifiers';

  const filesBytes = utf8Bytes(JSON.stringify(files));
  if (filesBytes > WORKSPACE_JSON_LIMIT_BYTES) return 'Cloud workspace files exceed the 5 MB snapshot limit';
  if (utf8Bytes(scratchCode) > SCRATCH_LIMIT_BYTES) return 'Scratch editor content exceeds the 1 MB cloud limit';
  return null;
};

export const useCloudWorkspace = () => {
  const { user, isGuest } = useAuth();
  const [workspaces, setWorkspaces] = useState<CloudWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadWorkspaces = async () => {
    if (isGuest || !user) {
      setWorkspaces([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;
      const raw = data || [];
      const normalized = raw.map(normalizeWorkspace).filter((workspace): workspace is CloudWorkspace => workspace !== null);
      setWorkspaces(normalized);

      if (normalized.length !== raw.length) {
        toast.warning('One or more cloud workspaces could not be read safely');
      }
    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  const saveWorkspace = async (
    name: string,
    files: CloudWorkspaceFile[],
    activeFileId: string | null,
    language: string,
    scratchCode: string,
    description?: string,
    workspaceId?: string
  ): Promise<string | null> => {
    if (isGuest || !user) {
      toast.error('Sign in to save workspaces to cloud');
      return null;
    }

    const validationError = validateSnapshot(name, files, language, scratchCode, description);
    if (validationError) {
      toast.error(validationError);
      return null;
    }

    const normalizedActiveFileId = activeFileId && files.some(file => file.id === activeFileId)
      ? activeFileId
      : null;

    setIsSyncing(true);
    try {
      const payload = {
        name: name.trim(),
        description: description?.trim() || null,
        files: files as unknown as Json,
        active_file_id: normalizedActiveFileId,
        language: language as WorkspaceLanguage,
        scratch_code: scratchCode,
        last_accessed_at: new Date().toISOString(),
      };

      if (workspaceId) {
        const { error } = await supabase
          .from('workspaces')
          .update(payload)
          .eq('id', workspaceId)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Workspace snapshot updated');
        await loadWorkspaces();
        return workspaceId;
      }

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          user_id: user.id,
          ...payload,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Workspace snapshot saved to cloud');
      await loadWorkspaces();
      return data.id;
    } catch (error: any) {
      console.error('Error saving workspace:', error);
      toast.error(error?.message || 'Failed to save workspace to cloud');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  const loadWorkspace = async (workspaceId: string): Promise<CloudWorkspace | null> => {
    if (isGuest || !user) return null;

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      const workspace = normalizeWorkspace(data);
      if (!workspace) throw new Error('Workspace snapshot is invalid or corrupted');

      const { error: touchError } = await supabase
        .from('workspaces')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', workspaceId)
        .eq('user_id', user.id);

      if (touchError) {
        console.warn('Could not update workspace access time:', touchError);
      }
      await loadWorkspaces();
      return workspace;
    } catch (error: any) {
      console.error('Error loading workspace:', error);
      toast.error(error?.message || 'Failed to load workspace');
      return null;
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    if (isGuest || !user) return false;

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Workspace deleted');
      await loadWorkspaces();
      return true;
    } catch (error: any) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
      return false;
    }
  };

  useEffect(() => {
    if (!isGuest && user) {
      void loadWorkspaces();
    } else {
      setWorkspaces([]);
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
    isCloudEnabled: !isGuest && !!user
  };
};
