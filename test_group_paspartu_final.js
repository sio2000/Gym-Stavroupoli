// Test Group Paspartu Fix - Final Verification
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function testGroupPaspartuFix() {
  console.log('=== TESTING GROUP PASPARTU FIX ===\n');
  
  const userId = '7998415e-2b0b-4a40-9824-cadbd80f6f48';
  
  try {
    // 1. Check group assignments
    console.log('🔍 1. CHECKING GROUP ASSIGNMENTS:');
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
    
    // 2. Check schedule sessions
    console.log('\n🔍 2. CHECKING SCHEDULE SESSIONS:');
    const { data: schedule, error: scheduleError } = await supabase
      .from('personal_training_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', 'paspartu')
      .single();
    
    if (scheduleError) {
      console.error('❌ Schedule error:', scheduleError);
    } else {
      console.log('✅ Schedule found:', schedule.id);
      console.log('   Sessions count:', schedule.schedule_data?.sessions?.length || 0);
      console.log('   Monthly total:', schedule.monthly_total);
      
      if (schedule.schedule_data?.sessions?.length > 0) {
        console.log('   Sessions:');
        schedule.schedule_data.sessions.forEach((session, index) => {
          console.log(`     ${index + 1}. ${session.id} - ${session.date} ${session.startTime}-${session.endTime}`);
          console.log(`        Trainer: ${session.trainer}, Room: ${session.room}`);
        });
      }
    }
    
    // 3. Check lesson deposit
    console.log('\n🔍 3. CHECKING LESSON DEPOSIT:');
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
    
    // 4. Check bookings (should be 0 initially)
    console.log('\n🔍 4. CHECKING BOOKINGS:');
    const { data: bookings, error: bookingsError } = await supabase
      .from('lesson_bookings')
      .select('*')
      .eq('user_id', userId);
    
    if (bookingsError) {
      console.error('❌ Bookings error:', bookingsError);
    } else {
      console.log('✅ Bookings found:', bookings?.length || 0);
      if (bookings?.length > 0) {
        bookings.forEach((booking, index) => {
          console.log(`   Booking ${index + 1}: ${booking.session_id} - ${booking.booking_date}`);
        });
      }
    }
    
    // 5. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Group Assignments: ${assignments?.length || 0}`);
    console.log(`   Schedule Sessions: ${schedule?.schedule_data?.sessions?.length || 0}`);
    console.log(`   Lesson Deposit: ${deposit ? 'Yes' : 'No'}`);
    console.log(`   Bookings: ${bookings?.length || 0}`);
    
    if ((assignments?.length || 0) >= 4 && 
        (schedule?.schedule_data?.sessions?.length || 0) >= 4 && 
        deposit && 
        (bookings?.length || 0) === 0) {
      console.log('\n🎉 SUCCESS: Group Paspartu setup is complete!');
      console.log('   ✅ User has group assignments');
      console.log('   ✅ Schedule has sessions from admin');
      console.log('   ✅ Lesson deposit is created');
      console.log('   ✅ No bookings yet (as expected)');
      console.log('\n   🔥 The user can now see sessions in PaspartuTraining.tsx');
      console.log('   🔥 Sessions will only appear when users make bookings (as requested)');
    } else {
      console.log('\n❌ ISSUES DETECTED:');
      if ((assignments?.length || 0) < 4) console.log('   - Missing group assignments');
      if ((schedule?.schedule_data?.sessions?.length || 0) < 4) console.log('   - Missing schedule sessions');
      if (!deposit) console.log('   - Missing lesson deposit');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGroupPaspartuFix().catch(console.error);
