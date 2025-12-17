/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Υποστήριξη fallback σε process.env όταν δεν τρέχουμε μέσα σε Vite (π.χ. tsx, tests)
const viteEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
const supabaseUrl = viteEnv.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Ensure env variables are set.');
}

// Create Supabase client (browser: singleton στο window, server/tests: απλό client)
const getOrCreateClient = (): SupabaseClient => {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser) {
    const w = window as unknown as { __freegym_supabase?: SupabaseClient };
    if (w.__freegym_supabase) return w.__freegym_supabase;
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'sb-freegym-auth'
      }
    });
    w.__freegym_supabase = client;
    return client;
  }

  // Node/test περιβάλλον: δεν υπάρχει window, φτιάχνουμε απλό client
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const supabase = getOrCreateClient();

// Helper function to check connection
export const checkConnection = async () => {
  try {
    const { error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    return { success: true, message: 'Connected to Supabase' };
  } catch (error) {
    return { success: false, message: `Connection failed: ${error}` };
  }
};