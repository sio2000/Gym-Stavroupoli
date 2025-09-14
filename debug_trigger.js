// Debug script for Paspartu Lesson Deposit System trigger
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTrigger() {
  console.log('🔍 Debugging Paspartu Lesson Deposit System Trigger...\n');

  try {
    // Test 1: Check if trigger exists
    console.log('1️⃣ Checking if trigger exists...');
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT trigger_name, event_manipulation, action_statement 
              FROM information_schema.triggers 
              WHERE trigger_name = 'trigger_update_deposit_on_booking'` 
      });

    if (triggerError) {
      console.error('❌ Error checking triggers:', triggerError);
      return;
    }

    console.log('📊 Trigger check result:', triggers);

    // Test 2: Check if function exists
    console.log('\n2️⃣ Checking if function exists...');
    const { data: functions, error: functionError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT routine_name, routine_type 
              FROM information_schema.routines 
              WHERE routine_name = 'update_deposit_on_booking'` 
      });

    if (functionError) {
      console.error('❌ Error checking functions:', functionError);
      return;
    }

    console.log('📊 Function check result:', functions);

    // Test 3: Get a test user
    console.log('\n3️⃣ Getting test user...');
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

    // Test 4: Check current deposit
    console.log('\n4️⃣ Checking current deposit...');
    const { data: currentDeposit, error: depositError } = await supabase
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    if (depositError) {
      console.log('⚠️ No deposit found, creating one...');
      const { data: newDeposit, error: createError } = await supabase
        .from('lesson_deposits')
        .insert({
          user_id: testUser.user_id,
          total_lessons: 5,
          used_lessons: 0,
          created_by: testUser.user_id
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating deposit:', createError);
        return;
      }

      console.log('✅ Deposit created:', newDeposit);
    } else {
      console.log('📊 Current deposit:', currentDeposit);
    }

    // Test 5: Create a test schedule
    console.log('\n5️⃣ Creating test schedule...');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('personal_training_schedules')
      .insert({
        user_id: testUser.user_id,
        trainer_name: 'Test Trainer',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        schedule_data: {
          sessions: [{
            id: 'debug-test-session',
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

    // Test 6: Create booking and monitor trigger
    console.log('\n6️⃣ Creating booking and monitoring trigger...');
    
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
        session_id: 'debug-test-session',
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

    // Wait a moment for trigger to execute
    console.log('⏳ Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 2000));

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
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('lesson_bookings').delete().eq('id', bookingData.id);
    await supabase.from('personal_training_schedules').delete().eq('id', scheduleData.id);
    await supabase.from('lesson_deposits').delete().eq('user_id', testUser.user_id);
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugTrigger();
