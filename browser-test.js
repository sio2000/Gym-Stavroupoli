// Copy and paste this into browser console to test

// Test 1: Check if we can access Supabase
console.log('🔍 Testing Supabase access...');

// Get the Supabase client from the app
const supabase = window.supabase || window.__supabase;

if (!supabase) {
  console.error('❌ Supabase not found. Make sure you are on the app page.');
} else {
  console.log('✅ Supabase client found');
  
  // Test 2: Query schedules
  supabase
    .from('personal_training_schedules')
    .select('*')
    .limit(5)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error querying schedules:', error);
      } else {
        console.log('✅ Schedules found:', data?.length || 0);
        console.log('📊 Sample schedule:', data?.[0]);
      }
    });
  
  // Test 3: Query with user profiles
  supabase
    .from('personal_training_schedules')
    .select(`
      *,
      user_profiles!personal_training_schedules_user_id_fkey(
        first_name,
        last_name,
        email
      )
    `)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error querying with profiles:', error);
      } else {
        console.log('✅ Schedules with profiles:', data?.length || 0);
        
        // Filter for Mike/Jordan
        const mikeSchedules = data?.filter(schedule => {
          const sessions = schedule.schedule_data?.sessions || [];
          return sessions.some(session => session.trainer === 'Mike');
        }) || [];
        
        const jordanSchedules = data?.filter(schedule => {
          const sessions = schedule.schedule_data?.sessions || [];
          return sessions.some(session => session.trainer === 'Jordan');
        }) || [];
        
        console.log('🏋️ Mike schedules:', mikeSchedules.length);
        console.log('🥊 Jordan schedules:', jordanSchedules.length);
        
        if (mikeSchedules.length > 0) {
          console.log('📋 Sample Mike schedule:', mikeSchedules[0]);
        }
        
        if (jordanSchedules.length > 0) {
          console.log('📋 Sample Jordan schedule:', jordanSchedules[0]);
        }
      }
    });
}
