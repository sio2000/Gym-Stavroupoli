const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthFlowWithTimeout() {
  try {
    console.log('🧪 Δοκιμή AuthContext ροής με timeout...');
    
    const userId = 'cc94fb99-af31-471c-aecd-54aef836e46f';
    
    console.log('[Auth] ===== LOADING USER PROFILE =====');
    console.log('[Auth] User ID:', userId);
    console.log('[Auth] Supabase client:', !!supabase);
    
    console.log('[Auth] Using safe function to get profile...');
    console.log('[Auth] Calling get_user_profile_safe with user_id:', userId);
    
    // Προσομοίωση του AuthContext με timeout
    const profilePromise = supabase.rpc('get_user_profile_safe', {
      p_user_id: userId
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile query timeout after 10 seconds')), 10000)
    );
    
    console.log('[Auth] Starting Promise.race...');
    const startTime = Date.now();
    
    const result = await Promise.race([
      profilePromise,
      timeoutPromise
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const { data: profile, error } = result;
    
    console.log(`[Auth] Promise.race completed in ${duration}ms`);
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

    console.log('🎉 Δοκιμή AuthContext ροής ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα δοκιμής AuthContext ροής:', err);
    console.error('   Error message:', err.message);
    console.error('   Error stack:', err.stack);
  }
}

testAuthFlowWithTimeout();
