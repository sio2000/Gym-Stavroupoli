import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminRole() {
  console.log('🔧 Fixing admin role...\n');

  try {
    // First, let's check current admin users
    console.log('1️⃣ Checking current admin users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, role')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Error getting admin users:', adminError);
    } else {
      console.log('✅ Admin users found:', adminUsers?.length || 0);
      console.log('📊 Admin users:', adminUsers);
    }

    // Check all users
    console.log('\n2️⃣ Checking all users...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, role')
      .limit(10);

    if (allUsersError) {
      console.error('❌ Error getting all users:', allUsersError);
    } else {
      console.log('✅ All users found:', allUsers?.length || 0);
      console.log('📊 All users:', allUsers);
    }

    // Try to find admin@freegym.gr
    console.log('\n3️⃣ Looking for admin@freegym.gr...');
    const { data: adminUser, error: adminUserError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, role')
      .eq('email', 'admin@freegym.gr')
      .single();

    if (adminUserError) {
      console.error('❌ Error getting admin user:', adminUserError);
    } else {
      console.log('✅ Admin user found:', adminUser);
      
      if (adminUser && adminUser.role !== 'admin') {
        console.log('🔧 Updating admin role...');
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: 'admin' })
          .eq('user_id', adminUser.user_id);

        if (updateError) {
          console.error('❌ Error updating admin role:', updateError);
        } else {
          console.log('✅ Successfully updated admin role');
        }
      } else {
        console.log('✅ Admin role is already correct');
      }
    }

    // Check kettlebell points data
    console.log('\n4️⃣ Checking kettlebell points data...');
    const { data: kettlebellData, error: kettlebellError } = await supabase
      .from('user_kettlebell_points')
      .select('*')
      .limit(5);

    if (kettlebellError) {
      console.error('❌ Error getting kettlebell data:', kettlebellError);
    } else {
      console.log('✅ Kettlebell data found:', kettlebellData?.length || 0, 'records');
      console.log('📊 Kettlebell data:', kettlebellData);
    }

  } catch (error) {
    console.error('❌ Exception during admin role fix:', error);
  }
}

// Run the fix
fixAdminRole();
