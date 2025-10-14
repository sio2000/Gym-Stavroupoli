const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.log('❌ [Secretary Role Fix] VITE_SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixSecretaryRole() {
  console.log('🔧 [Secretary Role Fix] Fixing secretary role and metadata...');
  
  try {
    // Step 1: Find secretary user
    console.log('📋 [Step 1] Finding secretary user...');
    
    const { data: secretaryUsers, error: findError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .eq('email', 'receptiongym2025@gmail.com');
    
    if (findError) {
      console.log('❌ [Step 1] Error finding secretary user:', findError.message);
      return;
    }
    
    if (!secretaryUsers || secretaryUsers.length === 0) {
      console.log('❌ [Step 1] Secretary user not found');
      return;
    }
    
    const secretaryUser = secretaryUsers[0];
    console.log('✅ [Step 1] Found secretary user:', secretaryUser.email);
    console.log('🆔 [Step 1] User ID:', secretaryUser.id);
    console.log('👤 [Step 1] Current metadata:', secretaryUser.raw_user_meta_data);
    
    // Step 2: Update user metadata with secretary role
    console.log('📋 [Step 2] Updating secretary user metadata...');
    
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
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
      console.log('❌ [Step 2] Error updating secretary metadata:', updateError.message);
    } else {
      console.log('✅ [Step 2] Secretary metadata updated successfully');
      console.log('👤 [Step 2] New metadata:', updateData.user.user_metadata);
    }
    
    // Step 3: Ensure secretary has a user profile
    console.log('📋 [Step 3] Ensuring secretary has a user profile...');
    
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name')
      .eq('user_id', secretaryUser.id)
      .single();
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.log('❌ [Step 3] Error checking secretary profile:', profileCheckError.message);
    } else if (existingProfile) {
      console.log('✅ [Step 3] Secretary profile already exists:', existingProfile);
      
      // Update profile with secretary role
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: 'Reception',
          last_name: 'Staff',
          role: 'secretary'
        })
        .eq('user_id', secretaryUser.id);
      
      if (profileUpdateError) {
        console.log('⚠️  [Step 3] Error updating secretary profile:', profileUpdateError.message);
      } else {
        console.log('✅ [Step 3] Secretary profile updated with role');
      }
    } else {
      console.log('📋 [Step 3] Creating secretary profile...');
      
      const { error: profileCreateError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: secretaryUser.id,
          email: 'receptiongym2025@gmail.com',
          first_name: 'Reception',
          last_name: 'Staff',
          phone: null,
          language: 'el',
          role: 'secretary',
          created_by: 'admin'
        });
      
      if (profileCreateError) {
        console.log('❌ [Step 3] Error creating secretary profile:', profileCreateError.message);
      } else {
        console.log('✅ [Step 3] Secretary profile created successfully');
      }
    }
    
    // Step 4: Test secretary login and access
    console.log('📋 [Step 4] Testing secretary login and access...');
    
    const testSupabase = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: testAuth, error: testAuthError } = await testSupabase.auth.signInWithPassword({
      email: 'receptiongym2025@gmail.com',
      password: 'reception2025'
    });
    
    if (testAuthError) {
      console.log('❌ [Step 4] Secretary login failed:', testAuthError.message);
    } else {
      console.log('✅ [Step 4] Secretary login successful');
      console.log('👤 [Step 4] User role from metadata:', testAuth.user.user_metadata?.role);
      
      // Test profile access
      const { data: profileData, error: profileError } = await testSupabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email, role')
        .eq('user_id', secretaryUser.id)
        .single();
      
      if (profileError) {
        console.log('❌ [Step 4] Error accessing secretary profile:', profileError.message);
      } else {
        console.log('✅ [Step 4] Successfully accessed secretary profile:', profileData);
      }
      
      // Test reading all profiles (should work for secretary)
      const { data: allProfiles, error: allProfilesError } = await testSupabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .limit(5);
      
      if (allProfilesError) {
        console.log('❌ [Step 4] Error reading all profiles:', allProfilesError.message);
      } else {
        console.log('✅ [Step 4] Successfully read all profiles:', allProfiles?.length || 0, 'profiles');
      }
      
      await testSupabase.auth.signOut();
    }
    
  } catch (error) {
    console.log('💥 [Secretary Role Fix] Unexpected error:', error);
  }
}

// Run the fix
fixSecretaryRole().then(() => {
  console.log('🏁 [Secretary Role Fix] Fix completed');
  process.exit(0);
}).catch((error) => {
  console.log('💥 [Secretary Role Fix] Fatal error:', error);
  process.exit(1);
});
