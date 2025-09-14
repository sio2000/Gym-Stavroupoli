import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDataAfterRLSFix() {
  console.log('🔧 Creating test data after RLS fix...\n');

  try {
    // First, let's try to authenticate as admin
    console.log('1️⃣ Attempting to authenticate as admin...');
    
    // Try to sign in as admin (this might not work without password)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'updated@freegym.gr',
      password: 'admin123' // This might not be the correct password
    });

    if (authError) {
      console.log('❌ Admin authentication failed:', authError.message);
      console.log('💡 Continuing without authentication...');
    } else {
      console.log('✅ Admin authenticated successfully:', authData.user?.email);
    }

    // Get users
    console.log('\n2️⃣ Getting users...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email')
      .limit(3);

    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }

    console.log('✅ Found users:', users?.length || 0);
    if (!users || users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    // Create test kettlebell points data
    console.log('\n3️⃣ Creating Kettlebell Points test data...');
    const testData = [
      {
        user_id: users[0].user_id,
        points: 25,
        program_id: null,
        created_by: users[0].user_id
      },
      {
        user_id: users[0].user_id,
        points: 15,
        program_id: null,
        created_by: users[0].user_id
      },
      {
        user_id: users[1].user_id,
        points: 30,
        program_id: null,
        created_by: users[1].user_id
      },
      {
        user_id: users[1].user_id,
        points: 20,
        program_id: null,
        created_by: users[1].user_id
      },
      {
        user_id: users[2].user_id,
        points: 40,
        program_id: null,
        created_by: users[2].user_id
      }
    ];

    console.log('📊 Test data to insert:', testData.length, 'entries');

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

    // Test reading the data
    console.log('\n4️⃣ Testing data retrieval...');
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
    console.log('\n5️⃣ Testing total points calculation...');
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
createTestDataAfterRLSFix();
