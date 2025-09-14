import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createKettlebellData() {
  console.log('🔧 Creating Kettlebell Points data...\n');

  try {
    // Get users first
    console.log('1️⃣ Getting users...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email')
      .limit(5);

    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }

    console.log('✅ Found users:', users?.length || 0);
    if (!users || users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    // Create test data that matches what you see in the images
    console.log('\n2️⃣ Creating test Kettlebell Points data...');
    const testData = [
      // User 1 - Mike Trainer
      {
        user_id: users[0].user_id,
        points: 16,
        program_id: null,
        created_by: users[0].user_id
      },
      {
        user_id: users[0].user_id,
        points: 12,
        program_id: null,
        created_by: users[0].user_id
      },
      {
        user_id: users[0].user_id,
        points: 28,
        program_id: null,
        created_by: users[0].user_id
      },
      {
        user_id: users[0].user_id,
        points: 10,
        program_id: null,
        created_by: users[0].user_id
      },
      {
        user_id: users[0].user_id,
        points: 22,
        program_id: null,
        created_by: users[0].user_id
      },
      {
        user_id: users[0].user_id,
        points: 1212,
        program_id: null,
        created_by: users[0].user_id
      },
      // User 2 - Jordan Trainer
      {
        user_id: users[1].user_id,
        points: 16,
        program_id: null,
        created_by: users[1].user_id
      }
    ];

    console.log('📊 Test data to insert:', testData.length, 'entries');

    // Try to insert data
    const { data: insertedData, error: insertError } = await supabase
      .from('user_kettlebell_points')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Error inserting test data:', insertError);
      console.log('💡 RLS is still blocking. You need to disable RLS in Supabase dashboard.');
      console.log('💡 Go to Supabase Dashboard > Table Editor > user_kettlebell_points > Settings > RLS and disable it.');
    } else {
      console.log('✅ Successfully inserted test data:', insertedData?.length || 0, 'records');
      console.log('📊 Inserted data:', insertedData);
    }

    // Test reading the data
    console.log('\n3️⃣ Testing data retrieval...');
    const { data: readData, error: readError } = await supabase
      .from('user_kettlebell_points')
      .select(`
        user_id,
        points,
        created_at,
        user_profiles!user_kettlebell_points_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (readError) {
      console.error('❌ Error reading data:', readError);
    } else {
      console.log('✅ Successfully read data:', readData?.length || 0, 'records');
      console.log('📊 Read data:', readData);
    }

    // Test total points calculation
    console.log('\n4️⃣ Testing total points calculation...');
    const { data: totalData, error: totalError } = await supabase
      .from('user_kettlebell_points')
      .select('points');

    if (totalError) {
      console.error('❌ Error calculating total points:', totalError);
    } else {
      const totalPoints = totalData?.reduce((sum, record) => sum + record.points, 0) || 0;
      console.log('✅ Total points calculated:', totalPoints);
    }

  } catch (error) {
    console.error('❌ Exception during data creation:', error);
  }
}

createKettlebellData();
