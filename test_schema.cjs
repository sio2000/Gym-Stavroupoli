const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchema() {
  console.log('🔍 Testing personal_training_schedules schema...\n');

  try {
    // Test 1: Try to select all columns
    console.log('📋 Test 1: Selecting all columns...');
    const { data: allData, error: allError } = await supabase
      .from('personal_training_schedules')
      .select('*')
      .limit(1);

    if (allError) {
      console.error('❌ Error selecting all columns:', allError);
    } else {
      console.log('✅ All columns selected successfully');
      if (allData && allData.length > 0) {
        console.log('📊 Available columns:', Object.keys(allData[0]));
        if ('approval_status' in allData[0]) {
          console.log('✅ approval_status column exists');
        } else {
          console.log('❌ approval_status column missing');
        }
      }
    }

    // Test 2: Try to select specific columns including approval_status
    console.log('\n📋 Test 2: Selecting specific columns...');
    const { data: specificData, error: specificError } = await supabase
      .from('personal_training_schedules')
      .select('id, user_id, training_type, approval_status')
      .limit(1);

    if (specificError) {
      console.error('❌ Error selecting specific columns:', specificError);
    } else {
      console.log('✅ Specific columns selected successfully');
      if (specificData && specificData.length > 0) {
        console.log('📊 Sample data:', specificData[0]);
      }
    }

    // Test 3: Try to insert a test record
    console.log('\n📋 Test 3: Testing insert with approval_status...');
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000',
      training_type: 'individual',
      sessions: [],
      approval_status: 'pending'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('personal_training_schedules')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.error('❌ Error inserting test record:', insertError);
    } else {
      console.log('✅ Test record inserted successfully');
      console.log('📊 Inserted record:', insertData[0]);
      
      // Clean up the test record
      if (insertData && insertData.length > 0) {
        const { error: deleteError } = await supabase
          .from('personal_training_schedules')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.log('⚠️ Could not clean up test record:', deleteError);
        } else {
          console.log('🧹 Test record cleaned up');
        }
      }
    }

    // Test 4: Check if the issue is with the specific query in SecretaryDashboard
    console.log('\n📋 Test 4: Testing the exact query from SecretaryDashboard...');
    const { data: exactData, error: exactError } = await supabase
      .from('personal_training_schedules')
      .select('*')
      .eq('user_id', '38fb6388-3c2e-4744-9c83-7d9a23fe2920')
      .order('created_at', { ascending: false })
      .limit(1);

    if (exactError) {
      console.error('❌ Error with exact query:', exactError);
    } else {
      console.log('✅ Exact query successful');
      console.log('📊 Found records:', exactData ? exactData.length : 0);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSchema();
