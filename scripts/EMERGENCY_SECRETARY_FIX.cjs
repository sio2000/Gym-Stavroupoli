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

async function emergencySecretaryFix() {
  console.log('🚨 [EMERGENCY FIX] Starting comprehensive secretary fix...');
  
  try {
    // Step 1: Update secretary user metadata
    console.log('📋 [Step 1] Updating secretary user metadata...');
    
    if (serviceSupabase) {
      // Find secretary user
      const { data: secretaryUsers, error: findError } = await serviceSupabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .eq('email', 'receptiongym2025@gmail.com');
      
      if (findError) {
        console.log('❌ [Step 1] Error finding secretary user:', findError.message);
      } else if (secretaryUsers && secretaryUsers.length > 0) {
        const secretaryUser = secretaryUsers[0];
        console.log('✅ [Step 1] Found secretary user:', secretaryUser.email);
        
        // Update metadata with secretary role
        const { data: updateData, error: updateError } = await serviceSupabase.auth.admin.updateUserById(
          secretaryUser.id,
          {
            user_metadata: {
              role: 'secretary',
              first_name: 'Reception',
              last_name: 'Staff',
              is_secretary: true
            }
          }
        );
        
        if (updateError) {
          console.log('❌ [Step 1] Error updating metadata:', updateError.message);
        } else {
          console.log('✅ [Step 1] Secretary metadata updated:', updateData.user.user_metadata);
        }
      }
    }
    
    // Step 2: Ensure secretary has proper user profile
    console.log('📋 [Step 2] Ensuring secretary has proper user profile...');
    
    if (serviceSupabase) {
      const secretaryUserId = 'b4200e5c-0332-445b-8326-79175b2e670e'; // From the logs
      
      const { data: existingProfile, error: profileCheckError } = await serviceSupabase
        .from('user_profiles')
        .select('user_id, email, first_name, last_name, role')
        .eq('user_id', secretaryUserId)
        .single();
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.log('❌ [Step 2] Error checking profile:', profileCheckError.message);
      } else if (existingProfile) {
        console.log('✅ [Step 2] Secretary profile exists:', existingProfile);
        
        // Update with secretary role
        const { error: updateError } = await serviceSupabase
          .from('user_profiles')
          .update({
            role: 'secretary',
            first_name: 'Reception',
            last_name: 'Staff'
          })
          .eq('user_id', secretaryUserId);
        
        if (updateError) {
          console.log('⚠️  [Step 2] Error updating profile:', updateError.message);
        } else {
          console.log('✅ [Step 2] Secretary profile updated with role');
        }
      } else {
        console.log('📋 [Step 2] Creating secretary profile...');
        
        const { error: createError } = await serviceSupabase
          .from('user_profiles')
          .insert({
            user_id: secretaryUserId,
            email: 'receptiongym2025@gmail.com',
            first_name: 'Reception',
            last_name: 'Staff',
            phone: null,
            language: 'el',
            role: 'secretary',
            created_by: 'admin'
          });
        
        if (createError) {
          console.log('❌ [Step 2] Error creating profile:', createError.message);
        } else {
          console.log('✅ [Step 2] Secretary profile created');
        }
      }
    }
    
    // Step 3: Test secretary login
    console.log('📋 [Step 3] Testing secretary login...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'receptiongym2025@gmail.com',
      password: 'reception2025'
    });
    
    if (authError) {
      console.log('❌ [Step 3] Secretary login failed:', authError.message);
      console.log('💡 [Step 3] You need to run the RLS policy fix in Supabase SQL Editor');
      console.log('💡 [Step 3] Run: database/EMERGENCY_FIX_SECRETARY_RLS.sql');
      return;
    }
    
    console.log('✅ [Step 3] Secretary login successful:', authData.user.email);
    console.log('👤 [Step 3] User role:', authData.user.user_metadata?.role);
    
    // Step 4: Test profile access
    console.log('📋 [Step 4] Testing profile access...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, role')
      .eq('user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ [Step 4] Error accessing secretary profile:', profileError.message);
      console.log('💡 [Step 4] This is likely an RLS policy issue');
      console.log('💡 [Step 4] You need to run the RLS policy fix in Supabase SQL Editor');
      console.log('💡 [Step 4] Run: database/EMERGENCY_FIX_SECRETARY_RLS.sql');
    } else {
      console.log('✅ [Step 4] Successfully accessed secretary profile:', profileData);
    }
    
    // Step 5: Test reading all user profiles
    console.log('📋 [Step 5] Testing access to all user profiles...');
    
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email')
      .limit(10);
    
    if (allProfilesError) {
      console.log('❌ [Step 5] Error reading all profiles:', allProfilesError.message);
      console.log('💡 [Step 5] This is an RLS policy issue - secretary cannot see all profiles');
      console.log('💡 [Step 5] You need to run the RLS policy fix in Supabase SQL Editor');
      console.log('💡 [Step 5] Run: database/EMERGENCY_FIX_SECRETARY_RLS.sql');
    } else {
      console.log('✅ [Step 5] Successfully read all profiles:', allProfiles?.length || 0, 'profiles');
      if (allProfiles && allProfiles.length > 0) {
        console.log('📋 [Step 5] Sample profiles:');
        allProfiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.first_name} ${profile.last_name} (${profile.email})`);
        });
      }
    }
    
    // Logout
    await supabase.auth.signOut();
    console.log('🚪 [Step 5] Logged out');
    
    // Summary
    console.log('\n📊 [SUMMARY] Emergency Fix Results:');
    
    if (profileError || allProfilesError) {
      console.log('❌ Secretary still has access issues');
      console.log('🔧 IMMEDIATE ACTION REQUIRED:');
      console.log('   1. Go to Supabase SQL Editor');
      console.log('   2. Run: database/EMERGENCY_FIX_SECRETARY_RLS.sql');
      console.log('   3. Test secretary login again');
    } else {
      console.log('✅ Secretary access is working correctly');
      console.log('🎉 Secretary should now be able to access the secretary panel');
    }
    
  } catch (error) {
    console.log('💥 [EMERGENCY FIX] Unexpected error:', error);
  }
}

// Run the emergency fix
emergencySecretaryFix().then(() => {
  console.log('🏁 [EMERGENCY FIX] Emergency fix completed');
  process.exit(0);
}).catch((error) => {
  console.log('💥 [EMERGENCY FIX] Fatal error:', error);
  process.exit(1);
});
