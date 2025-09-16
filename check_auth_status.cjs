const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthStatus() {
  try {
    console.log('🔍 Checking authentication status and user profiles...');
    
    // Check all user profiles
    console.log('📝 Step 1: Checking all user profiles...');
    const { data: allProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        first_name,
        last_name,
        role,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`📊 Found ${allProfiles.length} total profiles:`);
      console.table(allProfiles);
    }

    // Check for specific issues
    console.log('📝 Step 2: Checking for specific issues...');
    const { data: unknownEmails, error: emailError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name')
      .eq('email', 'unknown@example.com');

    const { data: userNames, error: nameError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name')
      .eq('first_name', 'User');

    const { data: emptyLastNames, error: lastNameError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name')
      .eq('last_name', '');

    console.log(`📊 Profiles with unknown@example.com: ${unknownEmails?.length || 0}`);
    if (unknownEmails?.length > 0) console.table(unknownEmails);

    console.log(`📊 Profiles with first_name 'User': ${userNames?.length || 0}`);
    if (userNames?.length > 0) console.table(userNames);

    console.log(`📊 Profiles with empty last_name: ${emptyLastNames?.length || 0}`);
    if (emptyLastNames?.length > 0) console.table(emptyLastNames);

    // Test the get_user_profile_safe function
    console.log('📝 Step 3: Testing get_user_profile_safe function...');
    if (allProfiles && allProfiles.length > 0) {
      const testUserId = allProfiles[0].user_id;
      console.log(`🧪 Testing with user ID: ${testUserId}`);
      
      const { data: safeProfile, error: safeError } = await supabase
        .rpc('get_user_profile_safe', { p_user_id: testUserId });

      if (safeError) {
        console.error('❌ Error testing get_user_profile_safe:', safeError);
      } else {
        console.log('✅ get_user_profile_safe function works:');
        console.log(JSON.stringify(safeProfile, null, 2));
      }
    }

    // Check auth users
    console.log('📝 Step 4: Checking auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
    } else {
      console.log(`📊 Found ${authUsers.users.length} auth users:`);
      authUsers.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.id}) - Created: ${user.created_at}`);
      });
    }

  } catch (err) {
    console.error('❌ Error checking auth status:', err);
  }
}

checkAuthStatus();
