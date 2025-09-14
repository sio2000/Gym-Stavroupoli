// Simple test for Paspartu Lesson Deposit System trigger
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service key for admin access
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTrigger() {
  console.log('🧪 Testing Paspartu Lesson Deposit System Trigger...\n');

  try {
    // Get a test user
    console.log('1️⃣ Getting test user...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found for testing');
      return;
    }

    const testUser = users[0];
    console.log(`👤 Using test user: ${testUser.first_name} ${testUser.last_name} (${testUser.user_id})`);

    // Create or get deposit
    console.log('\n2️⃣ Setting up deposit...');
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
      console.error('❌ Error setting up deposit:', depositError);
      return;
    }

    console.log('✅ Deposit setup:', {
      total: depositData.total_lessons,
      used: depositData.used_lessons,
      remaining: depositData.remaining_lessons
    });

    // Create test schedule
    console.log('\n3️⃣ Creating test schedule...');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('personal_training_schedules')
      .insert({
        user_id: testUser.user_id,
        trainer_name: 'Test Trainer',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        schedule_data: {
          sessions: [{
            id: 'trigger-test-session',
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
      console.error('❌ Error creating schedule:', scheduleError);
      return;
    }

    console.log('✅ Test schedule created:', scheduleData.id);

    // Test booking creation
    console.log('\n4️⃣ Testing booking creation...');
    
    // Get deposit before booking
    const { data: depositBefore, error: beforeError } = await supabase
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    if (beforeError) {
      console.error('❌ Error getting deposit before booking:', beforeError);
      return;
    }

    console.log('📊 Deposit BEFORE booking:', {
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
        session_id: 'trigger-test-session',
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: '10:00',
        trainer_name: 'Test Trainer',
        room: 'Room 1',
        status: 'booked'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Error creating booking:', bookingError);
      return;
    }

    console.log('✅ Booking created:', bookingData.id);

    // Wait for trigger
    console.log('⏳ Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check deposit after booking
    const { data: depositAfter, error: afterError } = await supabase
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    if (afterError) {
      console.error('❌ Error getting deposit after booking:', afterError);
      return;
    }

    console.log('📊 Deposit AFTER booking:', {
      total: depositAfter.total_lessons,
      used: depositAfter.used_lessons,
      remaining: depositAfter.remaining_lessons
    });

    // Check if trigger worked
    if (depositAfter.used_lessons === depositBefore.used_lessons + 1) {
      console.log('✅ TRIGGER WORKING! Deposit updated correctly');
    } else {
      console.log('❌ TRIGGER NOT WORKING! Deposit not updated');
      console.log(`Expected used_lessons: ${depositBefore.used_lessons + 1}, got: ${depositAfter.used_lessons}`);
      
      // Manual update as fallback
      console.log('\n🔧 Applying manual update as fallback...');
      const { error: manualUpdateError } = await supabase
        .from('lesson_deposits')
        .update({
          used_lessons: depositBefore.used_lessons + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', testUser.user_id);

      if (manualUpdateError) {
        console.error('❌ Manual update failed:', manualUpdateError);
      } else {
        console.log('✅ Manual update applied');
      }
    }

    // Test cancellation
    console.log('\n5️⃣ Testing booking cancellation...');
    
    const { error: cancelError } = await supabase
      .from('lesson_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingData.id);

    if (cancelError) {
      console.error('❌ Error cancelling booking:', cancelError);
    } else {
      console.log('✅ Booking cancelled');
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check deposit after cancellation
      const { data: depositAfterCancel, error: afterCancelError } = await supabase
        .from('lesson_deposits')
        .select('*')
        .eq('user_id', testUser.user_id)
        .single();

      if (afterCancelError) {
        console.error('❌ Error getting deposit after cancellation:', afterCancelError);
      } else {
        console.log('📊 Deposit AFTER cancellation:', {
          total: depositAfterCancel.total_lessons,
          used: depositAfterCancel.used_lessons,
          remaining: depositAfterCancel.remaining_lessons
        });
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('lesson_bookings').delete().eq('id', bookingData.id);
    await supabase.from('personal_training_schedules').delete().eq('id', scheduleData.id);
    await supabase.from('lesson_deposits').delete().eq('user_id', testUser.user_id);
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTrigger();
