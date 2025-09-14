// Complete test for Paspartu Lesson Deposit System
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service key for admin access
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteSystem() {
  console.log('🧪 Testing Complete Paspartu Lesson Deposit System...\n');

  try {
    // Test 1: Get existing test user
    console.log('1️⃣ Getting existing test user...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found for testing');
      return;
    }

    const testUser = users[0];
    console.log('✅ Using test user:', testUser.first_name, testUser.last_name, testUser.user_id);

    // Test 2: Create lesson deposit
    console.log('\n2️⃣ Creating lesson deposit...');
    const { data: depositData, error: depositError } = await supabase
      .from('lesson_deposits')
      .insert({
        user_id: testUser.user_id,
        total_lessons: 5,
        used_lessons: 0,
        created_by: testUser.user_id
      })
      .select()
      .single();

    if (depositError) {
      console.error('❌ Error creating deposit:', depositError);
      return;
    }

    console.log('✅ Deposit created:', {
      total: depositData.total_lessons,
      used: depositData.used_lessons,
      remaining: depositData.remaining_lessons
    });

    // Test 3: Create Paspartu schedule
    console.log('\n3️⃣ Creating Paspartu schedule...');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('personal_training_schedules')
      .insert({
        user_id: testUser.user_id,
        trainer_name: 'Test Trainer',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        schedule_data: {
          sessions: [
            {
              id: 'session-1',
              date: new Date().toISOString().split('T')[0],
              startTime: '10:00',
              endTime: '11:00',
              type: 'personal',
              trainer: 'Test Trainer',
              room: 'Room 1'
            },
            {
              id: 'session-2',
              date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              startTime: '11:00',
              endTime: '12:00',
              type: 'personal',
              trainer: 'Test Trainer',
              room: 'Room 1'
            }
          ]
        },
        status: 'accepted',
        user_type: 'paspartu',
        is_flexible: true,
        created_by: testUser.user_id
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('❌ Error creating schedule:', scheduleError);
      return;
    }

    console.log('✅ Paspartu schedule created:', scheduleData.id);

    // Test 4: Test multiple bookings
    console.log('\n4️⃣ Testing multiple bookings...');
    
    const bookings = [];
    for (let i = 1; i <= 3; i++) {
      console.log(`   Booking ${i}/3...`);
      
      // Get deposit before booking
      const { data: depositBefore, error: beforeError } = await supabase
        .from('lesson_deposits')
        .select('*')
        .eq('user_id', testUser.user_id)
        .single();

      if (beforeError) {
        console.error(`❌ Error getting deposit before booking ${i}:`, beforeError);
        continue;
      }

      console.log(`   Deposit before booking ${i}:`, {
        total: depositBefore.total_lessons,
        used: depositBefore.used_lessons,
        remaining: depositBefore.remaining_lessons
      });

      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('lesson_bookings')
        .insert({
          user_id: testUser.user_id,
          schedule_id: scheduleData.id,
          session_id: `session-${i}`,
          booking_date: new Date(Date.now() + (i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          booking_time: `${9 + i}:00`,
          trainer_name: 'Test Trainer',
          room: 'Room 1',
          status: 'booked'
        })
        .select()
        .single();

      if (bookingError) {
        console.error(`❌ Error creating booking ${i}:`, bookingError);
        continue;
      }

      bookings.push(bookingData);
      console.log(`   ✅ Booking ${i} created:`, bookingData.id);

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check deposit after booking
      const { data: depositAfter, error: afterError } = await supabase
        .from('lesson_deposits')
        .select('*')
        .eq('user_id', testUser.user_id)
        .single();

      if (afterError) {
        console.error(`❌ Error getting deposit after booking ${i}:`, afterError);
        continue;
      }

      console.log(`   Deposit after booking ${i}:`, {
        total: depositAfter.total_lessons,
        used: depositAfter.used_lessons,
        remaining: depositAfter.remaining_lessons
      });

      // Verify trigger worked
      if (depositAfter.used_lessons === depositBefore.used_lessons + 1) {
        console.log(`   ✅ TRIGGER WORKING for booking ${i}!`);
      } else {
        console.log(`   ❌ TRIGGER NOT WORKING for booking ${i}!`);
        console.log(`   Expected used_lessons: ${depositBefore.used_lessons + 1}, got: ${depositAfter.used_lessons}`);
      }
    }

    // Test 5: Test cancellations
    console.log('\n5️⃣ Testing cancellations...');
    
    for (let i = 0; i < 2; i++) {
      if (bookings[i]) {
        console.log(`   Cancelling booking ${i + 1}...`);
        
        // Get deposit before cancellation
        const { data: depositBefore, error: beforeError } = await supabase
          .from('lesson_deposits')
          .select('*')
          .eq('user_id', testUser.user_id)
          .single();

        if (beforeError) {
          console.error(`❌ Error getting deposit before cancellation ${i + 1}:`, beforeError);
          continue;
        }

        console.log(`   Deposit before cancellation ${i + 1}:`, {
          total: depositBefore.total_lessons,
          used: depositBefore.used_lessons,
          remaining: depositBefore.remaining_lessons
        });

        // Cancel booking
        const { error: cancelError } = await supabase
          .from('lesson_bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookings[i].id);

        if (cancelError) {
          console.error(`❌ Error cancelling booking ${i + 1}:`, cancelError);
          continue;
        }

        console.log(`   ✅ Booking ${i + 1} cancelled`);

        // Wait for trigger
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check deposit after cancellation
        const { data: depositAfter, error: afterError } = await supabase
          .from('lesson_deposits')
          .select('*')
          .eq('user_id', testUser.user_id)
          .single();

        if (afterError) {
          console.error(`❌ Error getting deposit after cancellation ${i + 1}:`, afterError);
          continue;
        }

        console.log(`   Deposit after cancellation ${i + 1}:`, {
          total: depositAfter.total_lessons,
          used: depositAfter.used_lessons,
          remaining: depositAfter.remaining_lessons
        });

        // Verify trigger worked
        if (depositAfter.used_lessons === Math.max(depositBefore.used_lessons - 1, 0)) {
          console.log(`   ✅ TRIGGER WORKING for cancellation ${i + 1}!`);
        } else {
          console.log(`   ❌ TRIGGER NOT WORKING for cancellation ${i + 1}!`);
          console.log(`   Expected used_lessons: ${Math.max(depositBefore.used_lessons - 1, 0)}, got: ${depositAfter.used_lessons}`);
        }
      }
    }

    // Test 6: Final verification
    console.log('\n6️⃣ Final verification...');
    const { data: finalDeposit, error: finalError } = await supabase
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    if (finalError) {
      console.error('❌ Error getting final deposit:', finalError);
    } else {
      console.log('📊 Final deposit state:', {
        total: finalDeposit.total_lessons,
        used: finalDeposit.used_lessons,
        remaining: finalDeposit.remaining_lessons
      });
      
      // Should have 1 used lesson (3 bookings - 2 cancellations = 1)
      if (finalDeposit.used_lessons === 1) {
        console.log('✅ FINAL VERIFICATION PASSED! System working correctly');
      } else {
        console.log('❌ FINAL VERIFICATION FAILED! Expected 1 used lesson, got:', finalDeposit.used_lessons);
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('lesson_bookings').delete().eq('user_id', testUser.user_id);
    await supabase.from('personal_training_schedules').delete().eq('user_id', testUser.user_id);
    await supabase.from('lesson_deposits').delete().eq('user_id', testUser.user_id);
    console.log('✅ Cleanup completed');

    console.log('\n🎉 Complete Paspartu Lesson Deposit System test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCompleteSystem();
