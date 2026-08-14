import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import { getGuestFingerprint } from '@/utils/guestFingerprint';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  subscription_status: string | null;
  subscription_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

interface EntitlementRow {
  capability: string;
  value: unknown;
  ends_at: string | null;
}

interface AIUsageInfo {
  allowed: boolean;
  tier: 'guest' | 'free' | 'pro';
  remaining: number;
  limit: number;
  used_today: number;
  message: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isGuest: boolean;
  isLoading: boolean;
  entitlementError: boolean;
  hasCapability: (capability: string) => boolean;
  refreshEntitlements: () => Promise<void>;
  aiUsage: AIUsageInfo | null;
  checkAIUsage: () => Promise<void>;
  recordAIUsage: (feature: string, action?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function entitlementEnabled(value: unknown): boolean {
  if (value === true || value === 1 || value === 'true') return true;
  if (value && typeof value === 'object' && 'enabled' in value) {
    return (value as { enabled?: unknown }).enabled === true;
  }
  return false;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entitlements, setEntitlements] = useState<EntitlementRow[]>([]);
  const [entitlementError, setEntitlementError] = useState(false);
  const [aiUsage, setAiUsage] = useState<AIUsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isGuest = !user;
  const guestFingerprint = isGuest ? getGuestFingerprint() : null;

  const refreshEntitlements = async () => {
    if (!isSupabaseConfigured) {
      setEntitlements([]);
      setEntitlementError(false);
      return;
    }

    // The checked-in generated types predate the shared PocketBI entitlement RPC.
    // Keep this cast isolated here until types are regenerated from the canonical schema.
    const { data, error } = await (supabase.rpc as any)('get_my_entitlements');
    if (error) {
      console.error('[AUTH] Entitlement refresh failed:', error);
      setEntitlements([]);
      setEntitlementError(true);
      return;
    }

    setEntitlements((data || []) as EntitlementRow[]);
    setEntitlementError(false);
  };

  const hasCapability = (capability: string) =>
    entitlements.some((row) => row.capability === capability && entitlementEnabled(row.value));

  const checkAIUsage = async () => {
    if (!isSupabaseConfigured) {
      setAiUsage({
        allowed: false,
        tier: isGuest ? 'guest' : 'free',
        remaining: 0,
        limit: isGuest ? 3 : 6,
        used_today: 0,
        message: 'AI features require PocketBI cloud configuration.'
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('check_ai_usage_limit', {
        p_user_id: user?.id || null,
        p_guest_fingerprint: guestFingerprint
      });
      if (error) throw error;
      if (data && typeof data === 'object') setAiUsage(data as unknown as AIUsageInfo);
    } catch (error) {
      console.error('[AUTH] Error checking AI usage:', error);
      setAiUsage({
        allowed: false,
        tier: isGuest ? 'guest' : 'free',
        remaining: 0,
        limit: isGuest ? 3 : 6,
        used_today: 0,
        message: 'Unable to check AI usage limits.'
      });
    }
  };

  const recordAIUsage = async (feature: string, action?: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase.rpc('record_ai_usage', {
        p_feature_name: feature,
        p_user_id: user?.id || null,
        p_guest_fingerprint: guestFingerprint,
        p_action_type: action || null
      });
      if (error) throw error;
      await checkAIUsage();
    } catch (error) {
      console.error('[AUTH] Error recording AI usage:', error);
    }
  };

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      setProfile(data ? (data as Profile) : null);
    } catch (error) {
      console.error('[AUTH] Error fetching profile:', error);
      setProfile(null);
    }
  };

  const syncSignedInUser = async (nextUser: User) => {
    await Promise.all([fetchProfile(nextUser.id), refreshEntitlements()]);
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setEntitlements([]);
    setEntitlementError(false);
    setAiUsage(null);

    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('[AUTH] Sign out error:', error);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!active) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setTimeout(() => {
          if (active) void syncSignedInUser(currentSession.user!);
        }, 0);
      } else {
        setProfile(null);
        setEntitlements([]);
        setEntitlementError(false);
      }
    });

    void supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!active) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) await syncSignedInUser(currentSession.user);
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLoading) void checkAIUsage();
  }, [user, isLoading]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    isGuest,
    isLoading,
    entitlementError,
    hasCapability,
    refreshEntitlements,
    aiUsage,
    checkAIUsage,
    recordAIUsage,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
