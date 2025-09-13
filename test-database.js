// Test script to check database connection and data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseKey = 'your-anon-key'; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Check if personal_training_schedules table exists
    console.log('\n1. Checking personal_training_schedules table...');
    const { data: schedules, error: schedulesError } = await supabase
      .from('personal_training_schedules')
      .select('*')
      .limit(5);
    
    if (schedulesError) {
      console.error('❌ Error querying schedules:', schedulesError);
      return;
    }
    
    console.log('✅ Schedules found:', schedules?.length || 0);
    console.log('📊 Sample schedule:', schedules?.[0]);
    
    // Test 2: Check user_profiles table
    console.log('\n2. Checking user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Error querying profiles:', profilesError);
      return;
    }
    
    console.log('✅ Profiles found:', profiles?.length || 0);
    console.log('📊 Sample profile:', profiles?.[0]);
    
    // Test 3: Check for Mike/Jordan schedules
    console.log('\n3. Checking for Mike/Jordan schedules...');
    const { data: mikeSchedules, error: mikeError } = await supabase
      .from('personal_training_schedules')
      .select(`
        *,
        user_profiles!personal_training_schedules_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `);
    
    if (mikeError) {
      console.error('❌ Error querying Mike schedules:', mikeError);
      return;
    }
    
    console.log('✅ All schedules found:', mikeSchedules?.length || 0);
    
    // Filter for Mike/Jordan
    const mikeSchedulesFiltered = mikeSchedules?.filter(schedule => {
      const sessions = schedule.schedule_data?.sessions || [];
      return sessions.some(session => session.trainer === 'Mike');
    }) || [];
    
    const jordanSchedulesFiltered = mikeSchedules?.filter(schedule => {
      const sessions = schedule.schedule_data?.sessions || [];
      return sessions.some(session => session.trainer === 'Jordan');
    }) || [];
    
    console.log('🏋️ Mike schedules:', mikeSchedulesFiltered.length);
    console.log('🥊 Jordan schedules:', jordanSchedulesFiltered.length);
    
    if (mikeSchedulesFiltered.length > 0) {
      console.log('📋 Sample Mike schedule:', mikeSchedulesFiltered[0]);
    }
    
    if (jordanSchedulesFiltered.length > 0) {
      console.log('📋 Sample Jordan schedule:', jordanSchedulesFiltered[0]);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabase();
