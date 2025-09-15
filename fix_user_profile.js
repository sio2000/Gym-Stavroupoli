// Fix User Profile Issue
// Διόρθωση του προβλήματος με τον user profile που λείπει

import { supabase } from './src/config/supabase.js';

const USER_ID = '4dd59117-6e73-4a2d-bd39-46d21c8c6f90';

async function fixUserProfile() {
  try {
    console.log('🔧 [Fix] Starting user profile fix...');
    console.log('🔧 [Fix] User ID:', USER_ID);

    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ [Fix] Auth error:', authError);
      return;
    }

    console.log('✅ [Fix] Auth user found:', authUser.user?.email);

    // Check if user profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', USER_ID)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ [Fix] Profile check error:', profileError);
      return;
    }

    if (existingProfile) {
      console.log('✅ [Fix] User profile already exists:', existingProfile);
      return;
    }

    console.log('🔧 [Fix] User profile not found, creating...');

    // Get user data from auth.users
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('id', USER_ID)
      .single();

    if (userError) {
      console.error('❌ [Fix] User data error:', userError);
      return;
    }

    console.log('✅ [Fix] User data found:', userData);

    // Create user profile
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: USER_ID,
        first_name: userData.raw_user_meta_data?.firstName || 'User',
        last_name: userData.raw_user_meta_data?.lastName || 'Name',
        email: userData.email,
        role: userData.raw_user_meta_data?.role || 'user',
        created_at: userData.created_at,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ [Fix] Create profile error:', createError);
      return;
    }

    console.log('✅ [Fix] User profile created successfully:', newProfile);

    // Verify the fix
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', USER_ID)
      .single();

    if (verifyError) {
      console.error('❌ [Fix] Verify error:', verifyError);
      return;
    }

    console.log('✅ [Fix] Verification successful:', verifyProfile);
    console.log('🎉 [Fix] User profile fix completed successfully!');

  } catch (error) {
    console.error('❌ [Fix] Unexpected error:', error);
  }
}

// Run the fix
fixUserProfile();