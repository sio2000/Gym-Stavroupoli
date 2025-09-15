// Create Missing User Profile
// Δημιουργία του user profile που λείπει

import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY'; // Replace with actual service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_ID = '4dd59117-6e73-4a2d-bd39-46d21c8c6f90';

async function createMissingUserProfile() {
  try {
    console.log('🔧 [Create] Starting user profile creation...');
    console.log('🔧 [Create] User ID:', USER_ID);

    // Check if user profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', USER_ID)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ [Create] Profile check error:', profileError);
      return;
    }

    if (existingProfile) {
      console.log('✅ [Create] User profile already exists:', existingProfile);
      return;
    }

    console.log('🔧 [Create] User profile not found, creating...');

    // Create user profile with basic data
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: USER_ID,
        first_name: 'User',
        last_name: 'Name',
        email: 'user@example.com', // This will be updated when user logs in
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ [Create] Create profile error:', createError);
      return;
    }

    console.log('✅ [Create] User profile created successfully:', newProfile);
    console.log('🎉 [Create] User profile creation completed successfully!');

  } catch (error) {
    console.error('❌ [Create] Unexpected error:', error);
  }
}

// Run the creation
createMissingUserProfile();
