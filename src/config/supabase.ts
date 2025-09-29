/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables from Vite (no fallbacks to avoid mismatched backends)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast so dev must configure the exact same env as production
  throw new Error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Ensure your local .env matches production.');
}

// Create Supabase client for frontend use (singleton to avoid multiple GoTrueClient instances)
const getOrCreateClient = (): SupabaseClient => {
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