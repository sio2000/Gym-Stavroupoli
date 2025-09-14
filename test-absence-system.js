// Copy and paste this into browser console to test the absence system
// Make sure you're logged in as trainer1@freegym.gr

console.log('🧪 Testing Absence System...');

// Get the Supabase client from the app
const supabase = window.supabase || window.__supabase;

if (!supabase) {
  console.error('❌ Supabase not found. Make sure you are on the app page.');
} else {
  console.log('✅ Supabase client found');
  
  // Test 1: Check if absence_records table exists and is accessible
  console.log('\n1. Testing absence_records table access...');
  supabase
    .from('absence_records')
    .select('*')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error accessing absence_records:', error);
        console.log('💡 Make sure you ran CREATE_ABSENCE_SYSTEM.sql');
        return;
      }
      
      console.log('✅ absence_records table accessible');
      console.log('📊 Current records:', data?.length || 0);
    });

  // Test 2: Test get_trainer_users function
  console.log('\n2. Testing get_trainer_users function...');
  supabase
    .rpc('get_trainer_users', { trainer_name_param: 'Mike' })
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error calling get_trainer_users:', error);
        return;
      }
      
      console.log('✅ get_trainer_users function working');
      console.log('👥 Mike users:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📋 Sample user data:', data[0]);
      } else {
        console.log('⚠️ No users found for Mike');
        console.log('💡 Admin needs to create schedules with Mike as trainer');
      }
    });

  // Test 3: Test get_trainer_users for Jordan
  console.log('\n3. Testing get_trainer_users for Jordan...');
  supabase
    .rpc('get_trainer_users', { trainer_name_param: 'Jordan' })
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error calling get_trainer_users for Jordan:', error);
        return;
      }
      
      console.log('✅ get_trainer_users for Jordan working');
      console.log('👥 Jordan users:', data?.length || 0);
    });

  // Test 4: Test add_absence function (if we have users)
  console.log('\n4. Testing add_absence function...');
  supabase
    .rpc('get_trainer_users', { trainer_name_param: 'Mike' })
    .then(({ data: users, error: usersError }) => {
      if (usersError || !users || users.length === 0) {
        console.log('⚠️ No users found, skipping add_absence test');
        return;
      }
      
      const testUser = users[0];
      console.log('🧪 Testing add_absence with user:', testUser.firstName, testUser.lastName);
      
      supabase
        .rpc('add_absence', {
          user_id_param: testUser.userId,
          trainer_name_param: 'Mike',
          session_id_param: 'test-session-123',
          session_date_param: new Date().toISOString().split('T')[0],
          session_time_param: '10:00:00',
          absence_type_param: 'absent',
          reason_param: 'Test absence',
          notes_param: 'This is a test absence'
        })
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ Error adding test absence:', error);
            return;
          }
          
          console.log('✅ add_absence function working');
          console.log('🆔 New absence ID:', data);
          
          // Test 5: Test get_user_absences
          console.log('\n5. Testing get_user_absences function...');
          supabase
            .rpc('get_user_absences', {
              user_id_param: testUser.userId,
              trainer_name_param: 'Mike'
            })
            .then(({ data: absences, error: absencesError }) => {
              if (absencesError) {
                console.error('❌ Error getting user absences:', absencesError);
                return;
              }
              
              console.log('✅ get_user_absences function working');
              console.log('📋 User absences:', absences?.length || 0);
              
              if (absences && absences.length > 0) {
                console.log('📝 Sample absence:', absences[0]);
                
                // Test 6: Test delete_absence
                console.log('\n6. Testing delete_absence function...');
                supabase
                  .rpc('delete_absence', { absence_id_param: absences[0].id })
                  .then(({ data: deleted, error: deleteError }) => {
                    if (deleteError) {
                      console.error('❌ Error deleting absence:', deleteError);
                      return;
                    }
                    
                    console.log('✅ delete_absence function working');
                    console.log('🗑️ Absence deleted:', deleted);
                  });
              }
            });
        });
    });

  // Test 7: Check RLS policies
  console.log('\n7. Testing RLS policies...');
  supabase
    .from('absence_records')
    .select('id, user_id, trainer_name, absence_type')
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ RLS policy issue:', error);
        console.log('💡 Check RLS policies in CREATE_ABSENCE_SYSTEM.sql');
      } else {
        console.log('✅ RLS policies working correctly');
        console.log('📊 Accessible absences:', data?.length || 0);
      }
    });

  // Test 8: Check current user and trainer mapping
  console.log('\n8. Checking current user...');
  supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error) {
      console.error('❌ Error getting user:', error);
    } else {
      console.log('👤 Current user:', user?.email);
      console.log('🆔 User ID:', user?.id);
      
      if (user?.email === 'trainer1@freegym.gr') {
        console.log('🎯 This user should see Mike schedules and users');
      } else if (user?.email === 'trainer2@freegym.gr') {
        console.log('🎯 This user should see Jordan schedules and users');
      } else {
        console.log('⚠️ Unknown trainer email - check AuthContext.tsx for trainer mapping');
      }
    }
  });
}

console.log('\n🎯 Absence System Test Complete!');
console.log('📋 Next steps:');
console.log('1. Run CREATE_ABSENCE_SYSTEM.sql in Supabase');
console.log('2. Create schedules with Mike/Jordan as trainers in Admin Panel');
console.log('3. Go to Trainer Panel → Σύστημα Απουσιών');
console.log('4. Test adding absences for users');
