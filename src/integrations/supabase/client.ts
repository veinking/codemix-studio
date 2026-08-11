import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

const isPlaceholder = (value?: string) => !value || value.includes('your-') || value.includes('placeholder');

export const isSupabaseConfigured = !isPlaceholder(SUPABASE_URL) && !isPlaceholder(SUPABASE_PUBLISHABLE_KEY);

const clientUrl = isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co';
const clientKey = isSupabaseConfigured ? SUPABASE_PUBLISHABLE_KEY : 'placeholder-anon-key';

if (!isSupabaseConfigured) {
  console.info(
    '[bIDE] Local Mode active. Auth, cloud sync, AI functions, sharing, and payments are disabled until Supabase is configured.'
  );

  // Plain-English error explanations depend on a Supabase Edge Function.
  // Clear a previously persisted opt-in so Local Mode never attempts a
  // placeholder cloud request after a user has used a configured deployment.
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('plainEnglishMode', 'false');
  }
}

export const supabase = createClient<Database>(clientUrl, clientKey, {
  auth: {
    storage: localStorage,
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
  }
});
