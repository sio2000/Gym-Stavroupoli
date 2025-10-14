const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRLSPolicies() {
  console.log('🔍 [RLS Check] Checking RLS policies for user_profiles table...');
  
  try {
    // Test 1: Try to read user_profiles as secretary
    console.log('📋 [RLS Check] Test 1: Reading user_profiles with current user...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ [RLS Check] Error reading user_profiles:', profilesError);
    } else {
      console.log('✅ [RLS Check] Successfully read user_profiles:', profiles?.length || 0, 'profiles');
    }

    // Test 2: Try to read a specific user profile
    console.log('📋 [RLS Check] Test 2: Reading specific user profile...');
    const { data: specificProfile, error: specificError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email')
      .eq('user_id', 'b4200e5c-0332-445b-8326-79175b2e670e') // Secretary user ID
      .maybeSingle();
    
    if (specificError) {
      console.log('❌ [RLS Check] Error reading specific profile:', specificError);
    } else {
      console.log('✅ [RLS Check] Successfully read specific profile:', specificProfile);
    }

    // Test 3: Check if we can read membership_requests
    console.log('📋 [RLS Check] Test 3: Reading membership_requests...');
    const { data: requests, error: requestsError } = await supabase
      .from('membership_requests')
      .select('id, user_id')
      .limit(5);
    
    if (requestsError) {
      console.log('❌ [RLS Check] Error reading membership_requests:', requestsError);
    } else {
      console.log('✅ [RLS Check] Successfully read membership_requests:', requests?.length || 0, 'requests');
    }

    // Test 4: Check current user session
    console.log('📋 [RLS Check] Test 4: Checking current user session...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ [RLS Check] Error getting user:', userError);
    } else {
      console.log('✅ [RLS Check] Current user:', user?.email || 'No user');
      console.log('📧 [RLS Check] User ID:', user?.id || 'No ID');
    }

  } catch (error) {
    console.log('💥 [RLS Check] Unexpected error:', error);
  }
}

// Run the check
checkRLSPolicies().then(() => {
  console.log('🏁 [RLS Check] Check completed');
  process.exit(0);
}).catch((error) => {
  console.log('💥 [RLS Check] Fatal error:', error);
  process.exit(1);
});

