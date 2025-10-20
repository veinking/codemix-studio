import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
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
  aiUsage: AIUsageInfo | null;
  checkAIUsage: () => Promise<void>;
  recordAIUsage: (feature: string, action?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isGuest = !user;
  const guestFingerprint = isGuest ? getGuestFingerprint() : null;
  
  // Check AI usage limits
  const checkAIUsage = async () => {
    try {
      const { data, error } = await supabase.rpc('check_ai_usage_limit', {
        p_user_id: user?.id || null,
        p_guest_fingerprint: guestFingerprint
      });
      
      if (error) throw error;
      
      if (data && typeof data === 'object') {
        setAiUsage(data as unknown as AIUsageInfo);
      }
    } catch (error) {
      console.error('Error checking AI usage:', error);
      // Set default values on error
      setAiUsage({
        allowed: false,
        tier: isGuest ? 'guest' : 'free',
        remaining: 0,
        limit: isGuest ? 3 : 6,
        used_today: 0,
        message: 'Unable to check usage limits'
      });
    }
  };
  
  // Record AI usage
  const recordAIUsage = async (feature: string, action?: string) => {
    try {
      // Note: Parameter order changed to match SQL function signature
      await supabase.rpc('record_ai_usage', {
        p_feature_name: feature,
        p_user_id: user?.id || null,
        p_guest_fingerprint: guestFingerprint,
        p_action_type: action || null
      });
      await checkAIUsage(); // Refresh limits
    } catch (error) {
      console.error('Error recording AI usage:', error);
    }
  };
  
  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
      }
      
      // Check subscription status after fetching profile
      setTimeout(async () => {
        try {
          const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription');
          if (subError) {
            console.error('Error checking subscription:', subError);
          } else if (subData) {
            console.log('[AUTH] Subscription status:', subData);
          }
        } catch (err) {
          console.error('Failed to check subscription:', err);
        }
      }, 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };
  
  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setAiUsage(null);
  };
  
  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }
      
      setIsLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Check AI usage when user changes or on mount
  useEffect(() => {
    if (!isLoading) {
      checkAIUsage();
    }
  }, [user, isLoading]);
  
  const value: AuthContextType = {
    user,
    session,
    profile,
    isGuest,
    isLoading,
    aiUsage,
    checkAIUsage,
    recordAIUsage,
    signOut
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
