import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('🔧 Creating test Kettlebell Points data...\n');

  try {
    // First, let's get some user IDs
    console.log('1️⃣ Getting user IDs...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email')
      .limit(3);

    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }

    console.log('✅ Found users:', users?.length || 0);
    console.log('📊 Users:', users);

    if (!users || users.length === 0) {
      console.log('❌ No users found, cannot create test data');
      return;
    }

    // Create test kettlebell points data
    console.log('\n2️⃣ Creating test Kettlebell Points...');
    const testData = users.map((user, index) => ({
      user_id: user.user_id,
      points: (index + 1) * 10, // 10, 20, 30 points
      program_id: null, // Set to null since we don't have real program IDs
      created_by: user.user_id // Use the user as creator
    }));

    console.log('📊 Test data to insert:', testData);

    const { data: insertedData, error: insertError } = await supabase
      .from('user_kettlebell_points')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Error inserting test data:', insertError);
    } else {
      console.log('✅ Successfully inserted test data:', insertedData?.length || 0, 'records');
      console.log('📊 Inserted data:', insertedData);
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

  } catch (error) {
    console.error('❌ Exception during test data creation:', error);
  }
}

// Run the test
createTestData();
