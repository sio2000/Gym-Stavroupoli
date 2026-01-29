const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSecretaryLogin() {
  console.log('🧪 [SECRETARY TEST] Testing secretary login and role detection...');
  
  try {
    // Step 1: Test secretary login
    console.log('📋 [Step 1] Testing secretary login...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'receptiongym2025@gmail.com',
      password: 'Reception123!'
    });
    
    if (authError) {
      console.log('❌ [Step 1] Secretary login failed:', authError.message);
      return;
    }
    
    console.log('✅ [Step 1] Secretary login successful');
    console.log('📧 [Step 1] Email:', authData.user.email);
    console.log('🆔 [Step 1] User ID:', authData.user.id);
    console.log('👤 [Step 1] Metadata:', authData.user.user_metadata);
    
    // Step 2: Test profile access
    console.log('📋 [Step 2] Testing profile access...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, role')
      .eq('user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ [Step 2] Profile access failed:', profileError.message);
      console.log('💡 [Step 2] This means RLS is still blocking access');
      console.log('💡 [Step 2] You need to run: database/ULTRA_SIMPLE_SECRETARY_FIX.sql');
    } else {
      console.log('✅ [Step 2] Profile access successful');
      console.log('👤 [Step 2] Profile data:', profileData);
    }
    
    // Step 3: Test reading all profiles (secretary should see all)
    console.log('📋 [Step 3] Testing access to all user profiles...');
    
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, role')
      .limit(10);
    
    if (allProfilesError) {
      console.log('❌ [Step 3] All profiles access failed:', allProfilesError.message);
      console.log('💡 [Step 3] RLS is blocking secretary from seeing all profiles');
    } else {
      console.log('✅ [Step 3] All profiles access successful');
      console.log('📊 [Step 3] Found', allProfiles?.length || 0, 'profiles');
      
      if (allProfiles && allProfiles.length > 0) {
        console.log('📋 [Step 3] Sample profiles:');
        allProfiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.first_name} ${profile.last_name} (${profile.email}) - Role: ${profile.role || 'user'}`);
        });
      }
    }
    
    // Step 4: Test admin login too
    console.log('📋 [Step 4] Testing admin login...');
    
    await supabase.auth.signOut();
    
    const { data: adminAuthData, error: adminAuthError } = await supabase.auth.signInWithPassword({
      email: 'admin@freegym.gr',
      password: 'admin2025'
    });
    
    if (adminAuthError) {
      console.log('❌ [Step 4] Admin login failed:', adminAuthError.message);
    } else {
      console.log('✅ [Step 4] Admin login successful');
      console.log('📧 [Step 4] Admin email:', adminAuthData.user.email);
      
      // Test admin profile access
      const { data: adminProfile, error: adminProfileError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email, role')
        .eq('user_id', adminAuthData.user.id)
        .single();
      
      if (adminProfileError) {
        console.log('❌ [Step 4] Admin profile access failed:', adminProfileError.message);
      } else {
        console.log('✅ [Step 4] Admin profile access successful');
        console.log('👤 [Step 4] Admin profile:', adminProfile);
      }
    }
    
    // Logout
    await supabase.auth.signOut();
    console.log('🚪 [Step 4] Logged out');
    
    // Summary
    console.log('\n📊 [SUMMARY] Test Results:');
    
    if (profileError || allProfilesError) {
      console.log('❌ Secretary still has access issues');
      console.log('🔧 IMMEDIATE ACTION REQUIRED:');
      console.log('   1. Go to Supabase SQL Editor');
      console.log('   2. Run: database/ULTRA_SIMPLE_SECRETARY_FIX.sql');
      console.log('   3. This will temporarily disable RLS');
      console.log('   4. Test secretary login again');
    } else {
      console.log('✅ Secretary access is working correctly');
      console.log('🎉 Secretary should now be able to access the secretary panel');
    }
    
  } catch (error) {
    console.log('💥 [SECRETARY TEST] Unexpected error:', error);
  }
}

// Run the test
testSecretaryLogin().then(() => {
  console.log('🏁 [SECRETARY TEST] Test completed');
  process.exit(0);
}).catch((error) => {
  console.log('💥 [SECRETARY TEST] Fatal error:', error);
  process.exit(1);
});
