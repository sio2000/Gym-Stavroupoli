// Test script for Lesson Deposit System
// This script tests the triggers and functions for the Paspartu lesson deposit system

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLessonDepositSystem() {
  console.log('🧪 Testing Lesson Deposit System...\n');

  try {
    // Test 1: Run the database test function
    console.log('1️⃣ Running database trigger tests...');
    const { data: testResults, error: testError } = await supabase
      .rpc('test_lesson_deposit_triggers');

    if (testError) {
      console.error('❌ Database test failed:', testError);
      return;
    }

    console.log('📊 Test Results:');
    testResults.forEach(result => {
      const status = result.result === 'PASS' ? '✅' : result.result === 'FAIL' ? '❌' : 'ℹ️';
      console.log(`   ${status} ${result.test_name}: ${result.result}`);
    });

    // Test 2: Test with a real user (if available)
    console.log('\n2️⃣ Testing with real user data...');
    
    // Get a test user
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.log('⚠️ No users found for testing');
      return;
    }

    const testUser = users[0];
    console.log(`👤 Testing with user: ${testUser.first_name} ${testUser.last_name} (${testUser.user_id})`);

    // Test 3: Create a lesson deposit
    console.log('\n3️⃣ Creating lesson deposit...');
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
      console.error('❌ Failed to create deposit:', depositError);
      return;
    }

    console.log('✅ Deposit created:', {
      total: depositData.total_lessons,
      used: depositData.used_lessons,
      remaining: depositData.remaining_lessons
    });

    // Test 4: Create a test schedule
    console.log('\n4️⃣ Creating test schedule...');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('personal_training_schedules')
      .insert({
        user_id: testUser.user_id,
        trainer_name: 'Test Trainer',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        schedule_data: {
          sessions: [{
            id: 'test-session-1',
            date: new Date().toISOString().split('T')[0],
            startTime: '10:00',
            endTime: '11:00',
            type: 'personal',
            trainer: 'Test Trainer',
            room: 'Room 1'
          }]
        },
        status: 'accepted',
        user_type: 'paspartu',
        is_flexible: true,
        created_by: testUser.user_id
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('❌ Failed to create schedule:', scheduleError);
      return;
    }

    console.log('✅ Schedule created:', scheduleData.id);

    // Test 5: Create a booking and check if deposit is updated
    console.log('\n5️⃣ Creating booking and testing trigger...');
    
    const { data: bookingData, error: bookingError } = await supabase
      .from('lesson_bookings')
      .insert({
        user_id: testUser.user_id,
        schedule_id: scheduleData.id,
        session_id: 'test-session-1',
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: '10:00',
        trainer_name: 'Test Trainer',
        room: 'Room 1',
        status: 'booked'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Failed to create booking:', bookingError);
      return;
    }

    console.log('✅ Booking created:', bookingData.id);

    // Check if deposit was updated by trigger
    const { data: updatedDeposit, error: depositCheckError } = await supabase
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    if (depositCheckError) {
      console.error('❌ Failed to check deposit:', depositCheckError);
      return;
    }

    console.log('📊 Deposit after booking:', {
      total: updatedDeposit.total_lessons,
      used: updatedDeposit.used_lessons,
      remaining: updatedDeposit.remaining_lessons
    });

    if (updatedDeposit.used_lessons === 1 && updatedDeposit.remaining_lessons === 4) {
      console.log('✅ Trigger working correctly - deposit updated automatically!');
    } else {
      console.log('❌ Trigger not working - deposit not updated correctly');
    }

    // Test 6: Cancel booking and check if deposit is updated
    console.log('\n6️⃣ Cancelling booking and testing trigger...');
    
    const { error: cancelError } = await supabase
      .from('lesson_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingData.id);

    if (cancelError) {
      console.error('❌ Failed to cancel booking:', cancelError);
      return;
    }

    // Check if deposit was updated by trigger
    const { data: finalDeposit, error: finalDepositError } = await supabase
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    if (finalDepositError) {
      console.error('❌ Failed to check final deposit:', finalDepositError);
      return;
    }

    console.log('📊 Deposit after cancellation:', {
      total: finalDeposit.total_lessons,
      used: finalDeposit.used_lessons,
      remaining: finalDeposit.remaining_lessons
    });

    if (finalDeposit.used_lessons === 0 && finalDeposit.remaining_lessons === 5) {
      console.log('✅ Trigger working correctly - deposit updated on cancellation!');
    } else {
      console.log('❌ Trigger not working - deposit not updated on cancellation');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('lesson_bookings').delete().eq('id', bookingData.id);
    await supabase.from('personal_training_schedules').delete().eq('id', scheduleData.id);
    await supabase.from('lesson_deposits').delete().eq('user_id', testUser.user_id);
    
    console.log('✅ Cleanup completed');

    console.log('\n🎉 Lesson Deposit System test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testLessonDepositSystem();
