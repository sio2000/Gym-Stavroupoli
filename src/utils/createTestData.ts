import { supabase } from '@/config/supabase';

export const createTestTrainerSchedules = async () => {
  console.log('🚀 Creating test trainer schedules...');
  
  try {
    // First, get a user to create schedules for
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name')
      .eq('role', 'user')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️ No users found, creating a test user...');
      
      // Create a test user
      const { data: newUser, error: createUserError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: crypto.randomUUID(),
          email: 'testuser@freegym.gr',
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
          phone: '+300000000000'
        })
        .select()
        .single();
      
      if (createUserError) {
        console.error('❌ Error creating user:', createUserError);
        return;
      }
      
      users.push(newUser);
    }
    
    const testUser = users[0];
    console.log('👤 Using user:', testUser.email);
    
    // Create Mike's schedule
    const mikeSchedule = {
      user_id: testUser.user_id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      schedule_data: {
        sessions: [
          {
            id: 'mike-session-1',
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '10:00',
            type: 'personal',
            trainer: 'Mike',
            room: 'Αίθουσα Mike',
            notes: 'Morning personal training with Mike'
          },
          {
            id: 'mike-session-2',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            startTime: '18:00',
            endTime: '19:00',
            type: 'kickboxing',
            trainer: 'Mike',
            room: 'Αίθουσα Mike',
            notes: 'Evening kickboxing with Mike'
          }
        ],
        notes: 'Mike training program',
        trainer: 'Mike',
        specialInstructions: 'Focus on strength and technique'
      },
      status: 'accepted',
      created_by: testUser.user_id
    };
    
    // Create Jordan's schedule
    const jordanSchedule = {
      user_id: testUser.user_id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      schedule_data: {
        sessions: [
          {
            id: 'jordan-session-1',
            date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            startTime: '14:00',
            endTime: '15:00',
            type: 'personal',
            trainer: 'Jordan',
            room: 'Αίθουσα Jordan',
            notes: 'Afternoon personal training with Jordan'
          },
          {
            id: 'jordan-session-2',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            startTime: '19:00',
            endTime: '20:00',
            type: 'combo',
            trainer: 'Jordan',
            room: 'Αίθουσα Jordan',
            notes: 'Evening combo training with Jordan'
          }
        ],
        notes: 'Jordan training program',
        trainer: 'Jordan',
        specialInstructions: 'Focus on cardio and flexibility'
      },
      status: 'accepted',
      created_by: testUser.user_id
    };
    
    // Insert Mike's schedule
    console.log('📝 Creating Mike schedule...');
    const { data: mikeData, error: mikeError } = await supabase
      .from('personal_training_schedules')
      .insert(mikeSchedule)
      .select();
    
    if (mikeError) {
      console.error('❌ Error creating Mike schedule:', mikeError);
    } else {
      console.log('✅ Mike schedule created:', mikeData);
    }
    
    // Insert Jordan's schedule
    console.log('📝 Creating Jordan schedule...');
    const { data: jordanData, error: jordanError } = await supabase
      .from('personal_training_schedules')
      .insert(jordanSchedule)
      .select();
    
    if (jordanError) {
      console.error('❌ Error creating Jordan schedule:', jordanError);
    } else {
      console.log('✅ Jordan schedule created:', jordanData);
    }
    
    // Verify creation
    console.log('🔍 Verifying schedules...');
    const { data: allSchedules, error: verifyError } = await supabase
      .from('personal_training_schedules')
      .select(`
        *,
        user_profiles!personal_training_schedules_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `);
    
    if (verifyError) {
      console.error('❌ Error verifying schedules:', verifyError);
    } else {
      console.log('📊 Total schedules:', allSchedules?.length || 0);
      
      const mikeCount = allSchedules?.filter(schedule => {
        const sessions = schedule.schedule_data?.sessions || [];
        return sessions.some(session => session.trainer === 'Mike');
      }).length || 0;
      
      const jordanCount = allSchedules?.filter(schedule => {
        const sessions = schedule.schedule_data?.sessions || [];
        return sessions.some(session => session.trainer === 'Jordan');
      }).length || 0;
      
      console.log('🏋️ Mike schedules:', mikeCount);
      console.log('🥊 Jordan schedules:', jordanCount);
    }
    
  } catch (error) {
    console.error('❌ Test data creation failed:', error);
  }
};
