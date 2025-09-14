/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
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