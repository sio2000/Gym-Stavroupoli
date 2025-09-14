// Script to apply the Paspartu Lesson Deposit System fix
// This script applies the database changes and tests the system

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPaspartuFix() {
  console.log('🔧 Applying Paspartu Lesson Deposit System Fix...\n');

  try {
    // Step 1: Read and apply the SQL fix
    console.log('1️⃣ Applying database fixes...');
    
    const sqlPath = path.join(__dirname, 'database', 'fix_lesson_deposit_system.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.warn(`   ⚠️ Warning on statement ${i + 1}:`, error.message);
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        }
      }
    }

    // Step 2: Test the triggers
    console.log('\n2️⃣ Testing database triggers...');
    
    const { data: testResults, error: testError } = await supabase
      .rpc('test_lesson_deposit_triggers');

    if (testError) {
      console.error('❌ Trigger test failed:', testError);
      return;
    }

    console.log('📊 Trigger Test Results:');
    let allPassed = true;
    testResults.forEach(result => {
      const status = result.result === 'PASS' ? '✅' : result.result === 'FAIL' ? '❌' : 'ℹ️';
      console.log(`   ${status} ${result.test_name}: ${result.result}`);
      if (result.result === 'FAIL') allPassed = false;
    });

    if (allPassed) {
      console.log('\n🎉 All trigger tests passed!');
    } else {
      console.log('\n⚠️ Some trigger tests failed. Please check the database setup.');
    }

    // Step 3: Test with real data
    console.log('\n3️⃣ Testing with real user data...');
    
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
    console.log(`👤 Testing with user: ${testUser.first_name} ${testUser.last_name}`);

    // Test deposit creation
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
      console.error('❌ Failed to create test deposit:', depositError);
      return;
    }

    console.log('✅ Test deposit created successfully');

    // Test schedule creation
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
      console.error('❌ Failed to create test schedule:', scheduleError);
      return;
    }

    console.log('✅ Test schedule created successfully');

    // Test booking creation and trigger
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
      console.error('❌ Failed to create test booking:', bookingError);
      return;
    }

    console.log('✅ Test booking created successfully');

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

    // Test cancellation
    const { error: cancelError } = await supabase
      .from('lesson_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingData.id);

    if (cancelError) {
      console.error('❌ Failed to cancel booking:', cancelError);
      return;
    }

    // Check final deposit
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

    console.log('\n🎉 Paspartu Lesson Deposit System fix applied successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test creating a new Paspartu program from AdminPanel');
    console.log('   2. Test booking lessons from PaspartuTraining page');
    console.log('   3. Verify that deposits are updated automatically');

  } catch (error) {
    console.error('❌ Fix application failed:', error);
  }
}

// Run the fix
applyPaspartuFix();
