// Test script for real user flow with Paspartu system
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testRealUserFlow() {
  console.log('🧪 Testing Real User Flow with Paspartu System...\n');

  try {
    // Get the specific user from the logs
    const testUserId = '7ba57510-20d2-4f81-93f6-abe0d40b768e';
    console.log(`👤 Testing with user: ${testUserId}`);

    // Step 1: Check current deposit state
    console.log('\n1️⃣ Checking current deposit state...');
    const { data: currentDeposit, error: depositError } = await supabaseAdmin
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (depositError) {
      console.error('❌ Error getting current deposit:', depositError);
      return;
    }

    console.log('📊 Current deposit:', {
      total: currentDeposit.total_lessons,
      used: currentDeposit.used_lessons,
      remaining: currentDeposit.remaining_lessons
    });

    // Step 2: Check current bookings
    console.log('\n2️⃣ Checking current bookings...');
    const { data: currentBookings, error: bookingsError } = await supabaseAdmin
      .from('lesson_bookings')
      .select('*')
      .eq('user_id', testUserId)
      .eq('status', 'booked');

    if (bookingsError) {
      console.error('❌ Error getting current bookings:', bookingsError);
      return;
    }

    console.log(`📊 Current bookings: ${currentBookings.length} booked lessons`);

    // Step 3: Test RPC function with anon client (simulating frontend)
    console.log('\n3️⃣ Testing RPC function with anon client...');
    
    const newUsedLessons = currentDeposit.used_lessons + 1;
    const { data: rpcResult, error: rpcError } = await supabaseAnon
      .rpc('update_lesson_deposit_manual', {
        p_user_id: testUserId,
        p_used_lessons: newUsedLessons
      });

    if (rpcError) {
      console.error('❌ RPC function failed:', rpcError);
      return;
    }

    console.log('✅ RPC function succeeded!');
    console.log('📊 Updated deposit:', {
      total: rpcResult.total_lessons,
      used: rpcResult.used_lessons,
      remaining: rpcResult.remaining_lessons
    });

    // Step 4: Verify the update
    console.log('\n4️⃣ Verifying the update...');
    const { data: verifyDeposit, error: verifyError } = await supabaseAdmin
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying deposit:', verifyError);
      return;
    }

    console.log('📊 Verified deposit:', {
      total: verifyDeposit.total_lessons,
      used: verifyDeposit.used_lessons,
      remaining: verifyDeposit.remaining_lessons
    });

    // Step 5: Test cancellation
    console.log('\n5️⃣ Testing cancellation...');
    const cancelUsedLessons = Math.max(verifyDeposit.used_lessons - 1, 0);
    const { data: cancelResult, error: cancelError } = await supabaseAnon
      .rpc('update_lesson_deposit_manual', {
        p_user_id: testUserId,
        p_used_lessons: cancelUsedLessons
      });

    if (cancelError) {
      console.error('❌ Cancel RPC function failed:', cancelError);
      return;
    }

    console.log('✅ Cancel RPC function succeeded!');
    console.log('📊 After cancellation:', {
      total: cancelResult.total_lessons,
      used: cancelResult.used_lessons,
      remaining: cancelResult.remaining_lessons
    });

    // Step 6: Final verification
    console.log('\n6️⃣ Final verification...');
    const { data: finalDeposit, error: finalError } = await supabaseAdmin
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (finalError) {
      console.error('❌ Error getting final deposit:', finalError);
      return;
    }

    console.log('📊 Final deposit state:', {
      total: finalDeposit.total_lessons,
      used: finalDeposit.used_lessons,
      remaining: finalDeposit.remaining_lessons
    });

    // Check if the system is working correctly
    const expectedUsed = currentDeposit.used_lessons + 1 - 1; // +1 for booking, -1 for cancellation
    if (finalDeposit.used_lessons === expectedUsed) {
      console.log('✅ SYSTEM WORKING CORRECTLY!');
      console.log(`Expected used_lessons: ${expectedUsed}, got: ${finalDeposit.used_lessons}`);
    } else {
      console.log('❌ SYSTEM NOT WORKING CORRECTLY!');
      console.log(`Expected used_lessons: ${expectedUsed}, got: ${finalDeposit.used_lessons}`);
    }

    console.log('\n🎉 Real user flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRealUserFlow();
