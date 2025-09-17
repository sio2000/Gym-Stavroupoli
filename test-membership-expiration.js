/**
 * Test script for membership expiration functionality
 * Run this with: node test-membership-expiration.js
 */

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMembershipExpiration() {
  console.log('🧪 Testing Membership Expiration System...\n');

  try {
    // Test 1: Check if expire_memberships function exists
    console.log('1️⃣ Testing expire_memberships function...');
    const { data: expireData, error: expireError } = await supabase.rpc('expire_memberships');
    
    if (expireError) {
      console.log('❌ expire_memberships function error:', expireError.message);
    } else {
      console.log('✅ expire_memberships function executed successfully');
    }

    // Test 2: Check if check_and_expire_memberships function exists
    console.log('\n2️⃣ Testing check_and_expire_memberships function...');
    const { data: checkData, error: checkError } = await supabase.rpc('check_and_expire_memberships');
    
    if (checkError) {
      console.log('❌ check_and_expire_memberships function error:', checkError.message);
    } else {
      console.log('✅ check_and_expire_memberships function executed successfully');
    }

    // Test 3: Check memberships table structure
    console.log('\n3️⃣ Checking memberships table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'memberships')
      .in('column_name', ['is_active', 'expires_at', 'status', 'end_date']);

    if (columnsError) {
      console.log('❌ Error checking table structure:', columnsError.message);
    } else {
      console.log('✅ Table structure check:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Test 4: Check existing memberships
    console.log('\n4️⃣ Checking existing memberships...');
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('id, user_id, status, is_active, end_date, expires_at')
      .limit(5);

    if (membershipsError) {
      console.log('❌ Error fetching memberships:', membershipsError.message);
    } else {
      console.log(`✅ Found ${memberships.length} memberships (showing first 5):`);
      memberships.forEach((membership, index) => {
        console.log(`   ${index + 1}. ID: ${membership.id.slice(0, 8)}...`);
        console.log(`      Status: ${membership.status}, Active: ${membership.is_active}`);
        console.log(`      End Date: ${membership.end_date}, Expires At: ${membership.expires_at || 'NULL'}`);
      });
    }

    // Test 5: Check memberships by status
    console.log('\n5️⃣ Checking memberships by status...');
    const { data: statusCounts, error: statusError } = await supabase
      .from('memberships')
      .select('status, is_active')
      .then(({ data, error }) => {
        if (error) throw error;
        const counts = {};
        data.forEach(m => {
          const key = `${m.status}_${m.is_active}`;
          counts[key] = (counts[key] || 0) + 1;
        });
        return { data: counts, error: null };
      });

    if (statusError) {
      console.log('❌ Error checking status counts:', statusError.message);
    } else {
      console.log('✅ Membership status counts:');
      Object.entries(statusCounts).forEach(([key, count]) => {
        console.log(`   - ${key}: ${count}`);
      });
    }

    // Test 6: Check for expired memberships
    console.log('\n6️⃣ Checking for expired memberships...');
    const today = new Date().toISOString().split('T')[0];
    const { data: expiredMemberships, error: expiredError } = await supabase
      .from('memberships')
      .select('id, user_id, status, is_active, end_date')
      .lt('end_date', today)
      .limit(5);

    if (expiredError) {
      console.log('❌ Error checking expired memberships:', expiredError.message);
    } else {
      console.log(`✅ Found ${expiredMemberships.length} expired memberships (showing first 5):`);
      expiredMemberships.forEach((membership, index) => {
        console.log(`   ${index + 1}. ID: ${membership.id.slice(0, 8)}...`);
        console.log(`      Status: ${membership.status}, Active: ${membership.is_active}`);
        console.log(`      End Date: ${membership.end_date} (expired: ${membership.end_date < today})`);
      });
    }

    console.log('\n🎉 Membership expiration system test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the migration: database/FIX_MEMBERSHIP_EXPIRATION.sql');
    console.log('2. Set up a cron job to run expire_memberships() daily');
    console.log('3. Test the UI to ensure expired memberships are hidden');
    console.log('4. Verify QR Codes menu is hidden when no active memberships');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testMembershipExpiration();
