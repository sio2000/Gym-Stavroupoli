// Test script για το Paspartu deposit fix
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function testPaspartuFix() {
  console.log('=== TESTING PASPARTU FIX ===');
  
  const userId = 'bcb09526-5d12-49cb-ad54-cdcb340150d4';
  
  // 1. Test the fix function
  console.log('\n1. Testing fix_paspartu_user_deposit...');
  try {
    const { data, error } = await supabase
      .rpc('fix_paspartu_user_deposit', {
        p_user_id: userId,
        p_total_lessons: 5,
        p_created_by: null
      });
    
    if (error) {
      console.error('Fix function error:', error);
    } else {
      console.log('Fix function result:', data);
    }
  } catch (err) {
    console.error('Fix function failed:', err.message);
  }
  
  // 2. Test adding sessions
  console.log('\n2. Testing add_paspartu_sessions_to_schedule...');
  try {
    const { data, error } = await supabase
      .rpc('add_paspartu_sessions_to_schedule', {
        p_user_id: userId,
        p_session_count: 5
      });
    
    if (error) {
      console.error('Sessions function error:', error);
    } else {
      console.log('Sessions function result:', data);
    }
  } catch (err) {
    console.error('Sessions function failed:', err.message);
  }
  
  // 3. Verify the fix
  console.log('\n3. Verifying the fix...');
  
  // Check deposit
  const { data: deposits, error: depositsError } = await supabase
    .from('lesson_deposits')
    .select('*')
    .eq('user_id', userId);
  
  if (depositsError) {
    console.error('Deposits verification error:', depositsError);
  } else {
    console.log('Deposits found:', deposits?.length || 0);
    deposits?.forEach((deposit, index) => {
      console.log('Deposit ' + (index + 1) + ':');
      console.log('  Total lessons:', deposit.total_lessons);
      console.log('  Used lessons:', deposit.used_lessons);
      console.log('  Remaining lessons:', deposit.remaining_lessons);
    });
  }
  
  // Check schedule
  const { data: schedules, error: schedulesError } = await supabase
    .from('personal_training_schedules')
    .select('*')
    .eq('user_id', userId)
    .eq('user_type', 'paspartu');
  
  if (schedulesError) {
    console.error('Schedules verification error:', schedulesError);
  } else {
    console.log('Paspartu schedules found:', schedules?.length || 0);
    schedules?.forEach((schedule, index) => {
      console.log('Schedule ' + (index + 1) + ':');
      console.log('  Sessions count:', schedule.schedule_data?.sessions?.length || 0);
      console.log('  Is flexible:', schedule.is_flexible);
    });
  }
  
  console.log('\n=== TEST COMPLETED ===');
}

testPaspartuFix().catch(console.error);
