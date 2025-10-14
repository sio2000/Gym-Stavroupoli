const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testUserProfilesAccess() {
  console.log('🔐 [User Profiles Test] Testing access to user_profiles table...');
  
  try {
    // Test 1: Try without authentication
    console.log('📋 [Test 1] Trying to read user_profiles without authentication...');
    const { data: profilesNoAuth, error: profilesNoAuthError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email')
      .limit(5);
    
    if (profilesNoAuthError) {
      console.log('❌ [Test 1] Error (expected):', profilesNoAuthError.message);
    } else {
      console.log('⚠️  [Test 1] Unexpected success:', profilesNoAuth?.length || 0, 'profiles');
    }

    // Test 2: Try with secretary credentials
    console.log('📋 [Test 2] Trying to login as secretary...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'receptiongym2025@gmail.com',
      password: 'reception2025'
    });

    if (authError) {
      console.log('❌ [Test 2] Secretary login failed:', authError.message);
      console.log('💡 [Test 2] This might be expected if secretary account does not exist');
    } else {
      console.log('✅ [Test 2] Successfully logged in as:', authData.user.email);
      
      // Test reading profiles as secretary
      console.log('📋 [Test 2a] Reading user_profiles as secretary...');
      const { data: profilesSecretary, error: profilesSecretaryError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .limit(10);
      
      if (profilesSecretaryError) {
        console.log('❌ [Test 2a] Error reading profiles as secretary:', profilesSecretaryError);
      } else {
        console.log('✅ [Test 2a] Successfully read user_profiles:', profilesSecretary?.length || 0, 'profiles');
        if (profilesSecretary && profilesSecretary.length > 0) {
          console.log('📋 [Test 2a] First profile:', profilesSecretary[0]);
        }
      }
      
      // Logout secretary
      await supabase.auth.signOut();
    }

    // Test 3: Try with service role key (if available)
    if (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
      console.log('📋 [Test 3] Testing with service role key...');
      const serviceSupabase = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      const { data: profilesService, error: profilesServiceError } = await serviceSupabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .limit(10);
      
      if (profilesServiceError) {
        console.log('❌ [Test 3] Error with service role:', profilesServiceError.message);
      } else {
        console.log('✅ [Test 3] Successfully read with service role:', profilesService?.length || 0, 'profiles');
        if (profilesService && profilesService.length > 0) {
          console.log('📋 [Test 3] First profile:', profilesService[0]);
        }
      }
    } else {
      console.log('⚠️  [Test 3] Service role key not available, skipping test');
    }

    // Test 4: Check if there are any profiles at all
    console.log('📋 [Test 4] Checking if there are any user_profiles in the database...');
    if (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
      const serviceSupabase = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      const { data: countData, error: countError } = await serviceSupabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log('❌ [Test 4] Error counting profiles:', countError.message);
      } else {
        console.log('✅ [Test 4] Total user_profiles in database:', countData?.length || 0);
      }
    }

  } catch (error) {
    console.log('💥 [User Profiles Test] Unexpected error:', error);
  }
}

// Run the test
testUserProfilesAccess().then(() => {
  console.log('🏁 [User Profiles Test] Test completed');
  process.exit(0);
}).catch((error) => {
  console.log('💥 [User Profiles Test] Fatal error:', error);
  process.exit(1);
});
