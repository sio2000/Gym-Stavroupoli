const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSecretaryAccess() {
  console.log('🔐 [Secretary Test] Testing secretary access to user_profiles...');
  
  try {
    // Login as secretary
    console.log('📧 [Secretary Test] Logging in as secretary...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'receptiongym2025@gmail.com',
      password: 'reception2025'
    });

    if (authError) {
      console.log('❌ [Secretary Test] Login failed:', authError);
      return;
    }

    console.log('✅ [Secretary Test] Successfully logged in as:', authData.user.email);

    // Test 1: Try to read user_profiles
    console.log('📋 [Secretary Test] Test 1: Reading user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email')
      .limit(10);
    
    if (profilesError) {
      console.log('❌ [Secretary Test] Error reading user_profiles:', profilesError);
      console.log('📊 [Secretary Test] Error details:', {
        code: profilesError.code,
        message: profilesError.message,
        details: profilesError.details,
        hint: profilesError.hint
      });
    } else {
      console.log('✅ [Secretary Test] Successfully read user_profiles:', profiles?.length || 0, 'profiles');
      if (profiles && profiles.length > 0) {
        console.log('📋 [Secretary Test] First profile:', profiles[0]);
      }
    }

    // Test 2: Try to read specific user profile
    console.log('📋 [Secretary Test] Test 2: Reading specific user profile...');
    const { data: specificProfile, error: specificError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email')
      .eq('user_id', 'f67431c1-0429-4ab0-9403-081dbbdb4cf5')
      .maybeSingle();
    
    if (specificError) {
      console.log('❌ [Secretary Test] Error reading specific profile:', specificError);
    } else {
      console.log('✅ [Secretary Test] Successfully read specific profile:', specificProfile);
    }

    // Test 3: Check membership_requests
    console.log('📋 [Secretary Test] Test 3: Reading membership_requests...');
    const { data: requests, error: requestsError } = await supabase
      .from('membership_requests')
      .select('id, user_id')
      .limit(5);
    
    if (requestsError) {
      console.log('❌ [Secretary Test] Error reading membership_requests:', requestsError);
    } else {
      console.log('✅ [Secretary Test] Successfully read membership_requests:', requests?.length || 0, 'requests');
    }

    // Test 4: Check user session
    console.log('📋 [Secretary Test] Test 4: Checking user session...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ [Secretary Test] Error getting user:', userError);
    } else {
      console.log('✅ [Secretary Test] Current user:', user?.email);
      console.log('🆔 [Secretary Test] User ID:', user?.id);
      console.log('👤 [Secretary Test] User role:', user?.user_metadata?.role || 'No role metadata');
    }

    // Logout
    await supabase.auth.signOut();
    console.log('🚪 [Secretary Test] Logged out');

  } catch (error) {
    console.log('💥 [Secretary Test] Unexpected error:', error);
  }
}

// Run the test
testSecretaryAccess().then(() => {
  console.log('🏁 [Secretary Test] Test completed');
  process.exit(0);
}).catch((error) => {
  console.log('💥 [Secretary Test] Fatal error:', error);
  process.exit(1);
});
