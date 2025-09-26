// Test Complete Group Paspartu Fix
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function testCompleteFix() {
  console.log('=== TESTING COMPLETE GROUP PASPARTU FIX ===\n');
  
  const userId = 'cf46b8c0-a5bf-41a8-8a22-ed25196a7896';
  
  try {
    // 1. Check schedule
    console.log('🔍 1. CHECKING SCHEDULE:');
    const { data: schedule, error: scheduleError } = await supabase
      .from('personal_training_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', 'paspartu')
      .single();
    
    if (scheduleError) {
      console.error('❌ Schedule error:', scheduleError);
      return;
    }
    
    console.log('✅ Schedule found:', schedule.id);
    console.log('   Training Type:', schedule.training_type);
    console.log('   User Type:', schedule.user_type);
    console.log('   Sessions count:', schedule.schedule_data?.sessions?.length || 0);
    console.log('   Monthly total:', schedule.monthly_total);
    
    if (schedule.schedule_data?.sessions?.length > 0) {
      console.log('   Sessions:');
      schedule.schedule_data.sessions.forEach((session, index) => {
        console.log(`     ${index + 1}. ${session.id} - ${session.date} ${session.startTime}-${session.endTime}`);
        console.log(`        Trainer: ${session.trainer}, Room: ${session.room}`);
      });
    }
    
    // 2. Check lesson deposit
    console.log('\n🔍 2. CHECKING LESSON DEPOSIT:');
    const { data: deposit, error: depositError } = await supabase
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (depositError) {
      console.error('❌ Deposit error:', depositError);
    } else {
      console.log('✅ Deposit found:', deposit.id);
      console.log(`   Total: ${deposit.total_lessons}, Used: ${deposit.used_lessons}, Remaining: ${deposit.remaining_lessons}`);
    }
    
    // 3. Check bookings
    console.log('\n🔍 3. CHECKING BOOKINGS:');
    const { data: bookings, error: bookingsError } = await supabase
      .from('lesson_bookings')
      .select('*')
      .eq('user_id', userId);
    
    if (bookingsError) {
      console.error('❌ Bookings error:', bookingsError);
    } else {
      console.log('✅ Bookings found:', bookings?.length || 0);
    }
    
    // 4. Check group assignments
    console.log('\n🔍 4. CHECKING GROUP ASSIGNMENTS:');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('group_assignments')
      .select('*')
      .eq('user_id', userId);
    
    if (assignmentsError) {
      console.error('❌ Assignments error:', assignmentsError);
    } else {
      console.log('✅ Group assignments found:', assignments?.length || 0);
      assignments?.forEach((assignment, index) => {
        console.log(`   Assignment ${index + 1}: ${assignment.group_identifier}`);
        console.log(`     Day: ${assignment.day_of_week}, Time: ${assignment.start_time}-${assignment.end_time}`);
        console.log(`     Trainer: ${assignment.trainer}, Room: ${assignment.room}`);
      });
    }
    
    // 5. Summary and recommendations
    console.log('\n📊 SUMMARY:');
    console.log(`   Schedule Sessions: ${schedule?.schedule_data?.sessions?.length || 0}`);
    console.log(`   Lesson Deposit: ${deposit ? 'Yes' : 'No'}`);
    console.log(`   Bookings: ${bookings?.length || 0}`);
    console.log(`   Group Assignments: ${assignments?.length || 0}`);
    
    // 6. Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (!deposit) {
      console.log('   ❌ MISSING: Lesson deposit - Run the SQL script to create it');
    }
    
    if ((assignments?.length || 0) === 0) {
      console.log('   ❌ MISSING: Group assignments - Run the SQL script to create them');
    }
    
    if ((schedule?.schedule_data?.sessions?.length || 0) > 0 && deposit && (bookings?.length || 0) === 0) {
      console.log('   ✅ READY: User can now see and book sessions in PaspartuTraining.tsx');
      console.log('   🔥 Expected behavior:');
      console.log('      - Sessions should appear in "Διαθέσιμες Ώρες"');
      console.log('      - User can click to book sessions');
      console.log('      - Deposit should decrease by 1 for each booking');
    }
    
    if ((schedule?.schedule_data?.sessions?.length || 0) === 0) {
      console.log('   ❌ CRITICAL: No sessions in schedule - Admin needs to create Group Paspartu program properly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteFix().catch(console.error);
