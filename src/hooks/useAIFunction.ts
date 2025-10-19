import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getGuestFingerprint } from '@/utils/guestFingerprint';

interface UseAIFunctionOptions {
  onUpgradeRequired?: () => void;
}

export const useAIFunction = (options?: UseAIFunctionOptions) => {
  const { isGuest, aiUsage, checkAIUsage } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const invokeAI = async <T = any>(
    functionName: string,
    body: any
  ): Promise<{ data: T | null; error: any; upgradeRequired?: boolean }> => {
    // Check limits before calling
    if (aiUsage && !aiUsage.allowed) {
      options?.onUpgradeRequired?.();
      return {
        data: null,
        error: { message: aiUsage.message, upgrade_required: true },
        upgradeRequired: true
      };
    }
    
    setIsLoading(true);
    
    try {
      const headers: Record<string, string> = {};
      
      // Add guest fingerprint if not authenticated
      if (isGuest) {
        headers['x-guest-fingerprint'] = getGuestFingerprint();
      }
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        headers
      });
      
      // Handle usage limit errors
      if (error && (error.status === 429 || data?.upgrade_required)) {
        options?.onUpgradeRequired?.();
        await checkAIUsage(); // Refresh usage info
        return {
          data: null,
          error: data || error,
          upgradeRequired: true
        };
      }
      
      if (error) {
        return { data: null, error };
      }
      
      // Refresh usage count after successful call
      await checkAIUsage();
      
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };
  
  return { invokeAI, isLoading };
};
