import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testKettlebellPoints() {
  console.log('🔍 Testing Kettlebell Points data loading...\n');

  try {
    // Test 1: Check if we can read user_kettlebell_points table
    console.log('1️⃣ Testing user_kettlebell_points table access...');
    const { data: pointsData, error: pointsError } = await supabase
      .from('user_kettlebell_points')
      .select('*')
      .limit(5);

    if (pointsError) {
      console.error('❌ Error reading user_kettlebell_points:', pointsError);
    } else {
      console.log('✅ Successfully read user_kettlebell_points:', pointsData?.length || 0, 'records');
      console.log('📊 Sample data:', pointsData);
    }

    // Test 2: Check if we can read with user_profiles join
    console.log('\n2️⃣ Testing user_kettlebell_points with user_profiles join...');
    const { data: joinedData, error: joinedError } = await supabase
      .from('user_kettlebell_points')
      .select(`
        user_id,
        points,
        created_at,
        user_profiles(
          first_name,
          last_name,
          email
        )
      `)
      .limit(5);

    if (joinedError) {
      console.error('❌ Error reading joined data:', joinedError);
    } else {
      console.log('✅ Successfully read joined data:', joinedData?.length || 0, 'records');
      console.log('📊 Sample joined data:', joinedData);
    }

    // Test 3: Check current user
    console.log('\n3️⃣ Testing current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting current user:', userError);
    } else {
      console.log('✅ Current user:', user?.email);
      console.log('📧 User metadata:', user?.user_metadata);
    }

    // Test 4: Check user profile
    if (user) {
      console.log('\n4️⃣ Testing user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, role, first_name, last_name, email')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error reading user profile:', profileError);
      } else {
        console.log('✅ User profile:', profile);
        console.log('🔑 User role:', profile?.role);
      }
    }

    // Test 5: Try to get total points
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
    console.error('❌ Exception during testing:', error);
  }
}

// Run the test
testKettlebellPoints();
