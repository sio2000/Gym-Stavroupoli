// Check RLS policies for lesson_deposits
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies for lesson_deposits...\n');

  try {
    // Check if RLS is enabled
    const { data: rlsEnabled, error: rlsError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT relrowsecurity FROM pg_class WHERE relname = 'lesson_deposits'` 
      });

    if (rlsError) {
      console.log('Using alternative method to check RLS...');
      
      // Try to get policies directly
      const { data: policies, error: policiesError } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
                FROM pg_policies 
                WHERE tablename = 'lesson_deposits'` 
        });

      if (policiesError) {
        console.error('❌ Error checking policies:', policiesError);
        return;
      }

      console.log('📊 RLS Policies for lesson_deposits:');
      console.log(policies);
    } else {
      console.log('📊 RLS Enabled:', rlsEnabled);
    }

    // Test with a specific user
    console.log('\n🧪 Testing with specific user...');
    
    // Get a user
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found');
      return;
    }

    const testUser = users[0];
    console.log(`👤 Testing with user: ${testUser.first_name} ${testUser.last_name} (${testUser.user_id})`);

    // Create a deposit for this user
    const { data: depositData, error: depositError } = await supabase
      .from('lesson_deposits')
      .upsert({
        user_id: testUser.user_id,
        total_lessons: 5,
        used_lessons: 0,
        created_by: testUser.user_id
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (depositError) {
      console.error('❌ Error creating deposit:', depositError);
      return;
    }

    console.log('✅ Deposit created:', depositData.id);

    // Try to read with anon key
    const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI');

    const { data: anonData, error: anonError } = await anonSupabase
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUser.user_id);

    if (anonError) {
      console.error('❌ Anon read failed:', anonError);
    } else {
      console.log('✅ Anon read succeeded:', anonData);
    }

    // Cleanup
    await supabase.from('lesson_deposits').delete().eq('user_id', testUser.user_id);
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkRLSPolicies();
