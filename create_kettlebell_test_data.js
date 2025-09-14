import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createKettlebellTestData() {
  console.log('🔧 Creating Kettlebell Points test data...\n');

  try {
    // Get some users to create data for
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

    // Create multiple kettlebell points entries for each user
    console.log('\n2️⃣ Creating Kettlebell Points entries...');
    const testData = [];
    
    users.forEach((user, userIndex) => {
      // Create 2-3 entries per user with different point values
      const entriesPerUser = 2 + (userIndex % 2); // 2 or 3 entries
      
      for (let i = 0; i < entriesPerUser; i++) {
        testData.push({
          user_id: user.user_id,
          points: (userIndex + 1) * 10 + (i + 1) * 5, // 15, 20, 25, 30, etc.
          program_id: null,
          created_by: user.user_id
        });
      }
    });

    console.log('📊 Test data to insert:', testData.length, 'entries');
    console.log('📊 Sample data:', testData.slice(0, 3));

    // Insert the data
    const { data: insertedData, error: insertError } = await supabase
      .from('user_kettlebell_points')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Error inserting test data:', insertError);
      
      // Try to insert one by one to see which ones fail
      console.log('\n🔄 Trying to insert one by one...');
      for (let i = 0; i < testData.length; i++) {
        const { data: singleInsert, error: singleError } = await supabase
          .from('user_kettlebell_points')
          .insert([testData[i]])
          .select();
        
        if (singleError) {
          console.error(`❌ Error inserting entry ${i}:`, singleError);
        } else {
          console.log(`✅ Successfully inserted entry ${i}`);
        }
      }
    } else {
      console.log('✅ Successfully inserted all test data:', insertedData?.length || 0, 'records');
    }

    // Now test reading the data
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
    console.error('❌ Exception during test data creation:', error);
  }
}

// Run the test
createKettlebellTestData();
