const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.log('❌ [Secretary Creation] VITE_SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSecretaryUser() {
  console.log('🔐 [Secretary Creation] Creating secretary user...');
  
  try {
    // Check if secretary user already exists
    console.log('📋 [Secretary Creation] Checking if secretary user already exists...');
    const { data: existingUsers, error: checkError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', 'receptiongym2025@gmail.com');
    
    if (checkError) {
      console.log('❌ [Secretary Creation] Error checking existing users:', checkError.message);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ [Secretary Creation] Secretary user already exists:', existingUsers[0].email);
      console.log('🆔 [Secretary Creation] User ID:', existingUsers[0].id);
      return;
    }
    
    // Create secretary user using Supabase Admin API
    console.log('📋 [Secretary Creation] Creating new secretary user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
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
      console.log('❌ [Secretary Creation] Error creating secretary user:', createError.message);
      return;
    }
    
    console.log('✅ [Secretary Creation] Secretary user created successfully!');
    console.log('🆔 [Secretary Creation] User ID:', newUser.user.id);
    console.log('📧 [Secretary Creation] Email:', newUser.user.email);
    
    // Create user profile for secretary
    console.log('📋 [Secretary Creation] Creating user profile for secretary...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: newUser.user.id,
        email: 'receptiongym2025@gmail.com',
        first_name: 'Reception',
        last_name: 'Staff',
        phone: null,
        language: 'el',
        created_by: 'admin'
      });
    
    if (profileError) {
      console.log('❌ [Secretary Creation] Error creating user profile:', profileError.message);
    } else {
      console.log('✅ [Secretary Creation] User profile created successfully!');
    }
    
    // Test login with new credentials
    console.log('📋 [Secretary Creation] Testing login with new credentials...');
    const testSupabase = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: testAuth, error: testError } = await testSupabase.auth.signInWithPassword({
      email: 'receptiongym2025@gmail.com',
      password: 'reception2025'
    });
    
    if (testError) {
      console.log('❌ [Secretary Creation] Login test failed:', testError.message);
    } else {
      console.log('✅ [Secretary Creation] Login test successful!');
      console.log('👤 [Secretary Creation] User role:', testAuth.user.user_metadata?.role || 'No role');
      
      // Test reading user profiles
      console.log('📋 [Secretary Creation] Testing access to user_profiles...');
      const { data: profiles, error: profilesError } = await testSupabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .limit(5);
      
      if (profilesError) {
        console.log('❌ [Secretary Creation] Error reading profiles:', profilesError.message);
        console.log('💡 [Secretary Creation] You may need to run the RLS policy fix script');
      } else {
        console.log('✅ [Secretary Creation] Successfully read user_profiles:', profiles?.length || 0, 'profiles');
        if (profiles && profiles.length > 0) {
          console.log('📋 [Secretary Creation] First profile:', profiles[0]);
        }
      }
      
      await testSupabase.auth.signOut();
    }

  } catch (error) {
    console.log('💥 [Secretary Creation] Unexpected error:', error);
  }
}

// Run the creation
createSecretaryUser().then(() => {
  console.log('🏁 [Secretary Creation] Process completed');
  process.exit(0);
}).catch((error) => {
  console.log('💥 [Secretary Creation] Fatal error:', error);
  process.exit(1);
});
