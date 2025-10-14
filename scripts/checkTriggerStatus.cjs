/**
 * CHECK TRIGGER STATUS SCRIPT
 * Ελέγχει αν το bulletproof trigger system είναι εγκατεστημένο και λειτουργεί
 */

const { createClient } = require('@supabase/supabase-js');

// Hardcoded Supabase credentials
const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTriggerStatus() {
  console.log('🔍 Checking Bulletproof Trigger System Status...');
  console.log('');

  try {
    // 1. Check if trigger function exists
    console.log('1️⃣ Checking trigger function...');
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT proname, prosrc 
          FROM pg_proc 
          WHERE proname = 'handle_new_user_bulletproof'
        `
      });

    if (funcError) {
      console.log('❌ Could not check functions:', funcError.message);
    } else {
      console.log('✅ Trigger function exists:', functions.length > 0 ? 'YES' : 'NO');
    }

    // 2. Check if trigger exists
    console.log('2️⃣ Checking trigger...');
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT tgname, tgrelid::regclass as table_name
          FROM pg_trigger 
          WHERE tgname = 'on_auth_user_created_bulletproof'
        `
      });

    if (triggerError) {
      console.log('❌ Could not check triggers:', triggerError.message);
    } else {
      console.log('✅ Trigger exists:', triggers.length > 0 ? 'YES' : 'NO');
      if (triggers.length > 0) {
        console.log('   📋 Trigger name:', triggers[0].tgname);
        console.log('   📋 Table:', triggers[0].table_name);
      }
    }

    // 3. Check recent auth users
    console.log('3️⃣ Checking recent auth users...');
    const { data: authUsers, error: authError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT id, email, created_at
          FROM auth.users 
          WHERE created_at > NOW() - INTERVAL '1 hour'
          ORDER BY created_at DESC
          LIMIT 5
        `
      });

    if (authError) {
      console.log('❌ Could not check auth users:', authError.message);
    } else {
      console.log(`✅ Found ${authUsers.length} recent auth users`);
      authUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id}) - ${user.created_at}`);
      });
    }

    // 4. Check recent user profiles
    console.log('4️⃣ Checking recent user profiles...');
    const { data: profiles, error: profileError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT user_id, email, first_name, last_name, created_at
          FROM user_profiles 
          WHERE created_at > NOW() - INTERVAL '1 hour'
          ORDER BY created_at DESC
          LIMIT 5
        `
      });

    if (profileError) {
      console.log('❌ Could not check user profiles:', profileError.message);
    } else {
      console.log(`✅ Found ${profiles.length} recent user profiles`);
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.first_name} ${profile.last_name} (${profile.email}) - ${profile.created_at}`);
      });
    }

    // 5. Check for missing profiles
    console.log('5️⃣ Checking for missing profiles...');
    const { data: missing, error: missingError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT COUNT(*) as missing_count
          FROM auth.users a
          LEFT JOIN user_profiles p ON a.id = p.user_id
          WHERE p.user_id IS NULL
          AND a.created_at > NOW() - INTERVAL '1 hour'
        `
      });

    if (missingError) {
      console.log('❌ Could not check missing profiles:', missingError.message);
    } else {
      const missingCount = missing[0]?.missing_count || 0;
      console.log(`✅ Missing profiles in last hour: ${missingCount}`);
      
      if (missingCount === 0) {
        console.log('🎉 All recent users have profiles! Trigger is working!');
      } else {
        console.log('⚠️ Some users are missing profiles. Trigger may not be working.');
      }
    }

    // 6. Test trigger manually (create a test user)
    console.log('6️⃣ Testing trigger manually...');
    const testEmail = `trigger_test_${Date.now()}@test.com`;
    
    try {
      // Create test user
      const { data: testAuth, error: testAuthError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User',
            language: 'el'
          }
        }
      });

      if (testAuthError) {
        console.log('❌ Could not create test user:', testAuthError.message);
      } else if (testAuth.user) {
        console.log('✅ Test user created:', testAuth.user.email);
        
        // Wait a bit for trigger
        await new Promise(r => setTimeout(r, 3000));
        
        // Check if profile was created
        const { data: testProfile, error: testProfileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', testAuth.user.id)
          .single();

        if (testProfileError) {
          console.log('❌ Test profile not found:', testProfileError.message);
        } else {
          console.log('✅ Test profile created successfully!');
          console.log(`   📋 Name: ${testProfile.first_name} ${testProfile.last_name}`);
          console.log(`   📋 Email: ${testProfile.email}`);
        }

        // Clean up test user
        await supabase.auth.signOut();
      }
    } catch (testError) {
      console.log('❌ Test failed:', testError.message);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
checkTriggerStatus().then(() => {
  console.log('');
  console.log('🔍 Trigger status check completed!');
}).catch(error => {
  console.error('❌ Check failed:', error);
});
