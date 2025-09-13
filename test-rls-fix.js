// Copy and paste this into browser console to test RLS fix
// Make sure you're logged in as trainer1@freegym.gr

console.log('🔍 Testing RLS fix...');

// Get the Supabase client from the app
const supabase = window.supabase || window.__supabase;

if (!supabase) {
  console.error('❌ Supabase not found. Make sure you are on the app page.');
} else {
  console.log('✅ Supabase client found');
  
  // Test 1: Simple query
  console.log('\n1. Testing simple query...');
  supabase
    .from('personal_training_schedules')
    .select('*')
    .limit(5)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Simple query failed:', error);
      } else {
        console.log('✅ Simple query succeeded:', data?.length || 0, 'schedules found');
        console.log('📊 Sample schedule:', data?.[0]);
      }
    });
  
  // Test 2: Query with user profiles
  console.log('\n2. Testing query with user profiles...');
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
        console.error('❌ Query with profiles failed:', error);
      } else {
        console.log('✅ Query with profiles succeeded:', data?.length || 0, 'schedules found');
        
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
        
        // Test the exact query used in TrainerDashboard
        console.log('\n3. Testing TrainerDashboard query...');
        const trainerName = 'Mike'; // or 'Jordan'
        const trainerSchedules = data?.filter(schedule => {
          const sessions = schedule.schedule_data?.sessions || [];
          return sessions.some(session => session.trainer === trainerName);
        }) || [];
        
        console.log(`🎯 ${trainerName} schedules found:`, trainerSchedules.length);
        
        if (trainerSchedules.length > 0) {
          console.log('✅ TrainerDashboard should now work!');
          console.log('📋 Sample trainer schedule:', trainerSchedules[0]);
        } else {
          console.log('⚠️ No schedules found for', trainerName);
        }
      }
    });
  
  // Test 3: Check current user
  console.log('\n4. Checking current user...');
  supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error) {
      console.error('❌ Error getting user:', error);
    } else {
      console.log('👤 Current user:', user?.email);
      console.log('🆔 User ID:', user?.id);
    }
  });
}
