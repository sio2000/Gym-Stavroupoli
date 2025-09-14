// Test script for manual update functionality
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase clients
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testManualUpdate() {
  console.log('🧪 Testing Manual Update Functionality...\n');

  try {
    // Get a test user
    console.log('1️⃣ Getting test user...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found for testing');
      return;
    }

    const testUser = users[0];
    console.log(`👤 Using test user: ${testUser.first_name} ${testUser.last_name} (${testUser.user_id})`);

    // Create test deposit
    console.log('\n2️⃣ Creating test deposit...');
    const { data: depositData, error: depositError } = await supabaseAdmin
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
      console.error('❌ Error creating test deposit:', depositError);
      return;
    }

    console.log('✅ Test deposit created:', {
      total: depositData.total_lessons,
      used: depositData.used_lessons,
      remaining: depositData.remaining_lessons
    });

    // Test 1: Try update with anon key (should fail)
    console.log('\n3️⃣ Testing update with anon key (should fail)...');
    const { error: anonUpdateError } = await supabaseAnon
      .from('lesson_deposits')
      .update({
        used_lessons: 1,
        remaining_lessons: 4,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', testUser.user_id);

    if (anonUpdateError) {
      console.log('✅ Anon update failed as expected:', anonUpdateError.message);
    } else {
      console.log('❌ Anon update succeeded (unexpected)');
    }

    // Test 2: Try update with admin key (should succeed)
    console.log('\n4️⃣ Testing update with admin key (should succeed)...');
    const { error: adminUpdateError } = await supabaseAdmin
      .from('lesson_deposits')
      .update({
        used_lessons: 2,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', testUser.user_id);

    if (adminUpdateError) {
      console.error('❌ Admin update failed:', adminUpdateError);
    } else {
      console.log('✅ Admin update succeeded!');
    }

    // Check the result
    console.log('\n5️⃣ Checking final result...');
    const { data: finalDeposit, error: checkError } = await supabaseAdmin
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    if (checkError) {
      console.error('❌ Error checking final deposit:', checkError);
    } else {
      console.log('📊 Final deposit:', {
        total: finalDeposit.total_lessons,
        used: finalDeposit.used_lessons,
        remaining: finalDeposit.remaining_lessons
      });
    }

    // Test 3: Simulate the frontend flow
    console.log('\n6️⃣ Simulating frontend flow...');
    
    // Get deposit with anon key
    const { data: anonDeposit, error: anonDepositError } = await supabaseAnon
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    if (anonDepositError) {
      console.error('❌ Error getting deposit with anon key:', anonDepositError);
    } else {
      console.log('📊 Deposit with anon key:', {
        total: anonDeposit.total_lessons,
        used: anonDeposit.used_lessons,
        remaining: anonDeposit.remaining_lessons
      });

      // Simulate manual update
      const { error: manualUpdateError } = await supabaseAdmin
        .from('lesson_deposits')
        .update({
          used_lessons: anonDeposit.used_lessons + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', testUser.user_id);

      if (manualUpdateError) {
        console.error('❌ Manual update failed:', manualUpdateError);
      } else {
        console.log('✅ Manual update succeeded!');
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabaseAdmin.from('lesson_deposits').delete().eq('user_id', testUser.user_id);
    console.log('✅ Cleanup completed');

    console.log('\n🎉 Manual update test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testManualUpdate();
