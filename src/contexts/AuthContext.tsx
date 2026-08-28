import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import { clearPocketBIOAuthSession, ensurePocketBIOAuthSession, isPocketBIOAuthSession } from '@/integrations/pocketbi/oauth';

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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isGuest: boolean;
  isLoading: boolean;
  entitlementError: boolean;
  hasCapability: (capability: string) => boolean;
  refreshEntitlements: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  const isGuest = !user;

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

    if (!isSupabaseConfigured) return;
    const oauthSession = isPocketBIOAuthSession();
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch (error) {
      console.error('[AUTH] Sign out error:', error);
    } finally {
      if (oauthSession) await clearPocketBIOAuthSession();
      else await supabase.auth.startAutoRefresh();
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

    void (async () => {
      try {
        await ensurePocketBIOAuthSession();
      } catch (error) {
        console.warn('[AUTH] PocketBI OAuth session could not be restored:', error);
        try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* local cleanup only */ }
        await clearPocketBIOAuthSession();
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!active) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) await syncSignedInUser(currentSession.user);
      if (active) setIsLoading(false);
    })();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    isGuest,
    isLoading,
    entitlementError,
    hasCapability,
    refreshEntitlements,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
