// Membership Test with Environment Variables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testMembershipSystem() {
  console.log('🧪 Testing Membership System with Environment Variables...\n');

  // Get environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables:');
    console.log('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    console.log('\nPlease create a .env file with:');
    console.log('VITE_SUPABASE_URL=your_supabase_url');
    console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
    return;
  }

  console.log('✅ Environment variables found');
  console.log('   URL:', supabaseUrl.substring(0, 30) + '...');
  console.log('   Key:', supabaseKey.substring(0, 20) + '...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Database connection
    console.log('1️⃣ Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('memberships')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database connection failed:', testError.message);
      return;
    }
    console.log('✅ Database connection successful\n');

    // Test 2: Check if is_active column exists
    console.log('2️⃣ Checking if is_active column exists...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'memberships')
      .eq('column_name', 'is_active');
    
    if (columnError) {
      console.log('❌ Error checking columns:', columnError.message);
    } else if (columns && columns.length > 0) {
      console.log('✅ is_active column exists');
    } else {
      console.log('❌ is_active column does not exist - run migration first!');
      console.log('   Run: database/MINIMAL_MEMBERSHIP_FIX.sql in Supabase SQL Editor');
      return;
    }

    // Test 3: Check existing memberships
    console.log('\n3️⃣ Checking existing memberships...');
    const { data: memberships, error: membershipError } = await supabase
      .from('memberships')
      .select('id, is_active, end_date, user_id')
      .limit(10);
    
    if (membershipError) {
      console.log('❌ Error fetching memberships:', membershipError.message);
    } else {
      console.log(`✅ Found ${memberships.length} memberships`);
      memberships.forEach((m, i) => {
        const endDate = m.end_date ? new Date(m.end_date).toLocaleDateString() : 'N/A';
        const isActive = m.is_active !== null ? m.is_active : 'NULL';
        console.log(`   ${i+1}. ID: ${m.id}, Active: ${isActive}, End Date: ${endDate}`);
      });
    }

    // Test 4: Test expire_memberships function
    console.log('\n4️⃣ Testing expire_memberships function...');
    const { error: expireError } = await supabase.rpc('expire_memberships');
    
    if (expireError) {
      console.log('❌ Error calling expire_memberships:', expireError.message);
    } else {
      console.log('✅ expire_memberships function executed successfully');
    }

    // Test 5: Test check_and_expire_memberships function
    console.log('\n5️⃣ Testing check_and_expire_memberships function...');
    const { error: checkError } = await supabase.rpc('check_and_expire_memberships');
    
    if (checkError) {
      console.log('❌ Error calling check_and_expire_memberships:', checkError.message);
    } else {
      console.log('✅ check_and_expire_memberships function executed successfully');
    }

    // Test 6: Check memberships after expiration
    console.log('\n6️⃣ Checking memberships after expiration...');
    const { data: activeMemberships, error: activeError } = await supabase
      .from('memberships')
      .select('id, is_active, end_date')
      .eq('is_active', true);
    
    if (activeError) {
      console.log('❌ Error fetching active memberships:', activeError.message);
    } else {
      console.log(`✅ Found ${activeMemberships.length} active memberships`);
    }

    const { data: expiredMemberships, error: expiredError } = await supabase
      .from('memberships')
      .select('id, is_active, end_date')
      .eq('is_active', false);
    
    if (expiredError) {
      console.log('❌ Error fetching expired memberships:', expiredError.message);
    } else {
      console.log(`✅ Found ${expiredMemberships.length} expired memberships`);
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Active memberships: ${activeMemberships?.length || 0}`);
    console.log(`   - Expired memberships: ${expiredMemberships?.length || 0}`);
    console.log(`   - Total memberships: ${(activeMemberships?.length || 0) + (expiredMemberships?.length || 0)}`);

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

// Run the test
testMembershipSystem();
