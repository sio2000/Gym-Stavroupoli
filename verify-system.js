// Copy and paste this into browser console to verify the system works
// Make sure you're logged in as trainer1@freegym.gr

console.log('🔍 Verifying system functionality...');

// Get the Supabase client from the app
const supabase = window.supabase || window.__supabase;

if (!supabase) {
  console.error('❌ Supabase not found. Make sure you are on the app page.');
} else {
  console.log('✅ Supabase client found');
  
  // Test 1: Check if we can read schedules
  console.log('\n1. Testing schedule access...');
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
        console.error('❌ Error reading schedules:', error);
        return;
      }
      
      console.log('✅ Schedules accessible:', data?.length || 0, 'total schedules');
      
      // Filter for Mike and Jordan
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
      
      // Test 2: Check if trainer panel query works
      console.log('\n2. Testing trainer panel query...');
      const trainerName = 'Mike'; // This should match the logged-in trainer
      const trainerSchedules = data?.filter(schedule => {
        const sessions = schedule.schedule_data?.sessions || [];
        return sessions.some(session => session.trainer === trainerName);
      }) || [];
      
      console.log(`🎯 ${trainerName} schedules for trainer panel:`, trainerSchedules.length);
      
      if (trainerSchedules.length > 0) {
        console.log('✅ Trainer panel should work!');
        
        // Show sample data
        const sampleSchedule = trainerSchedules[0];
        const sessions = sampleSchedule.schedule_data?.sessions || [];
        console.log('📋 Sample schedule data:');
        console.log('  - User:', sampleSchedule.user_profiles?.first_name, sampleSchedule.user_profiles?.last_name);
        console.log('  - Email:', sampleSchedule.user_profiles?.email);
        console.log('  - Sessions:', sessions.length);
        
        sessions.forEach((session, index) => {
          console.log(`  - Session ${index + 1}:`, {
            date: session.date,
            time: `${session.startTime}-${session.endTime}`,
            type: session.type,
            trainer: session.trainer,
            room: session.room,
            notes: session.notes
          });
        });
      } else {
        console.log('⚠️ No schedules found for', trainerName);
        console.log('💡 Admin needs to create schedules with trainer = "Mike" or "Jordan"');
      }
      
      // Test 3: Check for test data
      console.log('\n3. Checking for test data...');
      const hasTestData = data?.some(schedule => {
        const sessions = schedule.schedule_data?.sessions || [];
        return sessions.some(session => 
          session.id?.includes('test') || 
          session.id?.includes('mike-session') || 
          session.id?.includes('jordan-session') ||
          session.notes?.toLowerCase().includes('test')
        );
      }) || false;
      
      if (hasTestData) {
        console.log('⚠️ Test data still present - run CLEANUP_TEST_DATA.sql');
      } else {
        console.log('✅ No test data found - system is clean');
      }
      
      // Test 4: Check RLS policies
      console.log('\n4. Checking RLS policies...');
      supabase
        .from('personal_training_schedules')
        .select('id')
        .limit(1)
        .then(({ data: testData, error: testError }) => {
          if (testError) {
            console.error('❌ RLS policy issue:', testError);
          } else {
            console.log('✅ RLS policies working correctly');
          }
        });
    });
  
  // Test 5: Check current user
  console.log('\n5. Checking current user...');
  supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error) {
      console.error('❌ Error getting user:', error);
    } else {
      console.log('👤 Current user:', user?.email);
      console.log('🆔 User ID:', user?.id);
      
      // Check if user should see Mike or Jordan schedules
      if (user?.email === 'trainer1@freegym.gr') {
        console.log('🎯 This user should see Mike schedules');
      } else if (user?.email === 'trainer2@freegym.gr') {
        console.log('🎯 This user should see Jordan schedules');
      } else {
        console.log('⚠️ Unknown trainer email - check AuthContext.tsx for trainer mapping');
      }
    }
  });
}
