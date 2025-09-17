// Simple Membership Test Script
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMembershipSystem() {
  console.log('🧪 Testing Membership System...\n');

  try {
    // 1. Test database connection
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

    // 2. Check if is_active column exists
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
      return;
    }

    // 3. Check existing memberships
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
        console.log(`   ${i+1}. ID: ${m.id}, Active: ${m.is_active}, End Date: ${m.end_date}`);
      });
    }

    // 4. Test expire_memberships function
    console.log('\n4️⃣ Testing expire_memberships function...');
    const { error: expireError } = await supabase.rpc('expire_memberships');
    
    if (expireError) {
      console.log('❌ Error calling expire_memberships:', expireError.message);
    } else {
      console.log('✅ expire_memberships function executed successfully');
    }

    // 5. Test check_and_expire_memberships function
    console.log('\n5️⃣ Testing check_and_expire_memberships function...');
    const { error: checkError } = await supabase.rpc('check_and_expire_memberships');
    
    if (checkError) {
      console.log('❌ Error calling check_and_expire_memberships:', checkError.message);
    } else {
      console.log('✅ check_and_expire_memberships function executed successfully');
    }

    // 6. Check memberships after expiration
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

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

// Run the test
testMembershipSystem();
