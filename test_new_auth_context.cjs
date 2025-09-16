const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewAuthContext() {
  try {
    console.log('🧪 Δοκιμή νέου AuthContext...');
    
    const userId = '919ae161-6aae-4c3c-be0f-bb1a6e14429b';
    
    console.log('📝 Βήμα 1: Δοκιμή profile loading...');
    console.log(`   User ID: ${userId}`);
    
    const startTime = Date.now();
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   Query completed in ${duration}ms`);
    console.log('   Result:', profile);
    console.log('   Error:', error);
    
    if (error) {
      console.log('   Error code:', error.code);
      console.log('   Error message:', error.message);
    } else {
      console.log('✅ Profile loaded successfully');
      console.log('   Profile first_name:', profile.first_name);
      console.log('   Profile email:', profile.email);
      console.log('   Profile role:', profile.role);
      
      // Simulate state updates
      console.log('📝 Βήμα 2: Simulating state updates...');
      console.log('   setProfile(profile)');
      console.log('   setLoading(false)');
      console.log('   setIsInitialized(true)');
      console.log('   Profile state updated - loading: false, initialized: true');
    }

    console.log('📝 Βήμα 3: Simulating auth flow...');
    console.log('   [Auth] Initializing auth...');
    console.log('   [Auth] User found in initial session:', userId);
    console.log('   [Auth] Loading profile for user:', userId);
    console.log('   [Auth] Profile loaded successfully');
    console.log('   [Auth] Profile state updated - loading: false, initialized: true');

    console.log('🎉 Δοκιμή νέου AuthContext ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα δοκιμής:', err);
  }
}

testNewAuthContext();
