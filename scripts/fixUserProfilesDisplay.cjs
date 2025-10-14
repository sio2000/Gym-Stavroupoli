const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceSupabase = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

async function fixUserProfilesDisplay() {
  console.log('🔧 [Fix] Starting comprehensive fix for user_profiles display...');
  
  try {
    // Step 1: Check current state
    console.log('📋 [Step 1] Checking current state...');
    
    if (serviceSupabase) {
      const { data: countData, error: countError } = await serviceSupabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log('❌ [Step 1] Error counting profiles:', countError.message);
      } else {
        console.log('✅ [Step 1] Total user_profiles in database:', countData?.length || 0);
      }
    }
    
    // Step 2: Check if secretary user exists
    console.log('📋 [Step 2] Checking if secretary user exists...');
    
    let secretaryUserId = null;
    if (serviceSupabase) {
      const { data: secretaryData, error: secretaryError } = await serviceSupabase
        .from('auth.users')
        .select('id, email')
        .eq('email', 'receptiongym2025@gmail.com')
        .single();
      
      if (secretaryError && secretaryError.code !== 'PGRST116') {
        console.log('❌ [Step 2] Error checking secretary user:', secretaryError.message);
      } else if (secretaryData) {
        secretaryUserId = secretaryData.id;
        console.log('✅ [Step 2] Secretary user exists:', secretaryData.email);
      } else {
        console.log('⚠️  [Step 2] Secretary user does not exist');
      }
    }
    
    // Step 3: Create secretary user if needed
    if (!secretaryUserId && serviceSupabase) {
      console.log('📋 [Step 3] Creating secretary user...');
      
      const { data: newUser, error: createError } = await serviceSupabase.auth.admin.createUser({
        email: 'receptiongym2025@gmail.com',
        password: 'reception2025',
        email_confirm: true,
        user_metadata: {
          role: 'secretary',
          first_name: 'Reception',
          last_name: 'Staff'
        }
      });
      
      if (createError) {
        console.log('❌ [Step 3] Error creating secretary user:', createError.message);
      } else {
        secretaryUserId = newUser.user.id;
        console.log('✅ [Step 3] Secretary user created:', newUser.user.email);
        
        // Create profile for secretary
        const { error: profileError } = await serviceSupabase
          .from('user_profiles')
          .insert({
            user_id: secretaryUserId,
            email: 'receptiongym2025@gmail.com',
            first_name: 'Reception',
            last_name: 'Staff',
            phone: null,
            language: 'el',
            created_by: 'admin'
          });
        
        if (profileError) {
          console.log('⚠️  [Step 3] Error creating secretary profile:', profileError.message);
        } else {
          console.log('✅ [Step 3] Secretary profile created');
        }
      }
    }
    
    // Step 4: Test login as secretary
    console.log('📋 [Step 4] Testing secretary login...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'receptiongym2025@gmail.com',
      password: 'reception2025'
    });
    
    if (authError) {
      console.log('❌ [Step 4] Secretary login failed:', authError.message);
      console.log('💡 [Step 4] You may need to run the RLS policy fix script manually');
      return;
    }
    
    console.log('✅ [Step 4] Secretary login successful:', authData.user.email);
    
    // Step 5: Test reading user profiles
    console.log('📋 [Step 5] Testing access to user_profiles...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email')
      .limit(10);
    
    if (profilesError) {
      console.log('❌ [Step 5] Error reading profiles:', profilesError.message);
      console.log('📊 [Step 5] Error details:', {
        code: profilesError.code,
        message: profilesError.message,
        details: profilesError.details,
        hint: profilesError.hint
      });
      
      if (profilesError.code === '42501') {
        console.log('💡 [Step 5] This is a permission error. You need to run the RLS policy fix script:');
        console.log('   database/FIX_USER_PROFILES_SECRETARY_ACCESS.sql');
      }
    } else {
      console.log('✅ [Step 5] Successfully read user_profiles:', profiles?.length || 0, 'profiles');
      if (profiles && profiles.length > 0) {
        console.log('📋 [Step 5] Sample profiles:');
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.first_name} ${profile.last_name} (${profile.email})`);
        });
      } else {
        console.log('⚠️  [Step 5] No profiles found in database');
      }
    }
    
    // Step 6: Test specific profile access
    if (profiles && profiles.length > 0) {
      console.log('📋 [Step 6] Testing specific profile access...');
      
      const testUserId = profiles[0].user_id;
      const { data: specificProfile, error: specificError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .eq('user_id', testUserId)
        .single();
      
      if (specificError) {
        console.log('❌ [Step 6] Error reading specific profile:', specificError.message);
      } else {
        console.log('✅ [Step 6] Successfully read specific profile:', specificProfile);
      }
    }
    
    // Logout
    await supabase.auth.signOut();
    console.log('🚪 [Step 6] Logged out');
    
    // Summary
    console.log('\n📊 [Summary] Fix Results:');
    if (profilesError) {
      console.log('❌ User profiles are NOT accessible');
      console.log('💡 Solution: Run the RLS policy fix script in Supabase SQL Editor:');
      console.log('   database/FIX_USER_PROFILES_SECRETARY_ACCESS.sql');
    } else {
      console.log('✅ User profiles are accessible');
      console.log(`📋 Found ${profiles?.length || 0} profiles`);
    }
    
  } catch (error) {
    console.log('💥 [Fix] Unexpected error:', error);
  }
}

// Run the fix
fixUserProfilesDisplay().then(() => {
  console.log('🏁 [Fix] Fix process completed');
  process.exit(0);
}).catch((error) => {
  console.log('💥 [Fix] Fatal error:', error);
  process.exit(1);
});
