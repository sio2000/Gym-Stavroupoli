const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateAuthContext() {
  try {
    console.log('🧪 Προσομοίωση AuthContext ροής...');
    
    // Προσομοίωση της ροής που βλέπεις στα logs
    console.log('[Auth] ===== AUTH CONTEXT USEEFFECT STARTED =====');
    console.log('[Auth] isInitialized: false');
    
    console.log('[Auth] Calling getInitialSession...');
    console.log('[Auth] Getting initial session...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[Auth] Session query result - session:', session?.user?.id, 'error:', sessionError);
    
    if (session?.user) {
      console.log('[Auth] Initial session:', session);
      console.log('[Auth] User ID from session:', session.user.id);
      
      // Προσομοίωση loadUserProfile
      console.log('[Auth] ===== LOADING USER PROFILE =====');
      console.log('[Auth] User ID:', session.user.id);
      console.log('[Auth] Supabase client:', !!supabase);
      
      console.log('[Auth] Using safe function to get profile...');
      console.log('[Auth] Calling get_user_profile_safe with user_id:', session.user.id);
      
      const { data: profile, error } = await supabase.rpc('get_user_profile_safe', {
        p_user_id: session.user.id
      });

      console.log('[Auth] ===== SAFE FUNCTION RESPONSE =====');
      console.log('[Auth] Safe function result:', profile);
      console.log('[Auth] Safe function error:', error);
      console.log('[Auth] Profile type:', typeof profile);
      console.log('[Auth] Profile is null?', profile === null);
      console.log('[Auth] Profile is undefined?', profile === undefined);

      if (error) {
        console.error('[Auth] ===== SAFE FUNCTION ERROR =====');
        console.error('[Auth] Error code:', error.code);
        console.error('[Auth] Error message:', error.message);
        console.error('[Auth] Error details:', error.details);
        console.error('[Auth] Error hint:', error.hint);
      } else if (profile) {
        console.log('[Auth] ===== PROFILE LOADED SUCCESSFULLY =====');
        console.log('[Auth] Profile data:', JSON.stringify(profile, null, 2));
        console.log('[Auth] Profile first_name:', profile.first_name);
        console.log('[Auth] Profile email:', profile.email);
        console.log('[Auth] Profile role:', profile.role);
        console.log('[Auth] Profile state updated, loading set to false, initialized set to true');
      } else {
        console.log('[Auth] ===== NO PROFILE DATA =====');
        console.log('[Auth] No profile data returned from safe function');
        console.log('[Auth] Setting profile to null and marking as initialized');
      }
    } else {
      console.log('[Auth] No session found, setting loading to false and marking as initialized');
    }

    console.log('🎉 Προσομοίωση AuthContext ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα προσομοίωσης:', err);
  }
}

simulateAuthContext();
