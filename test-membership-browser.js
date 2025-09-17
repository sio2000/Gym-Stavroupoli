// Browser-based Membership Test
// Ανοίξτε το browser console και εκτελέστε αυτόν τον κώδικα

console.log('🧪 Testing Membership System in Browser...\n');

// Test 1: Check if Supabase is available
console.log('1️⃣ Checking Supabase availability...');
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase is available in browser');
} else {
  console.log('❌ Supabase not available - make sure you are on a page with Supabase loaded');
}

// Test 2: Test database connection
console.log('\n2️⃣ Testing database connection...');
if (typeof window !== 'undefined' && window.supabase) {
  window.supabase
    .from('memberships')
    .select('id')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Database connection failed:', error.message);
      } else {
        console.log('✅ Database connection successful');
        
        // Test 3: Check if is_active column exists
        console.log('\n3️⃣ Checking if is_active column exists...');
        return window.supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'memberships')
          .eq('column_name', 'is_active');
      }
    })
    .then(({ data: columns, error: columnError }) => {
      if (columnError) {
        console.log('❌ Error checking columns:', columnError.message);
      } else if (columns && columns.length > 0) {
        console.log('✅ is_active column exists');
      } else {
        console.log('❌ is_active column does not exist - run migration first!');
        return;
      }

      // Test 4: Check existing memberships
      console.log('\n4️⃣ Checking existing memberships...');
      return window.supabase
        .from('memberships')
        .select('id, is_active, end_date, user_id')
        .limit(10);
    })
    .then(({ data: memberships, error: membershipError }) => {
      if (membershipError) {
        console.log('❌ Error fetching memberships:', membershipError.message);
      } else {
        console.log(`✅ Found ${memberships.length} memberships`);
        memberships.forEach((m, i) => {
          console.log(`   ${i+1}. ID: ${m.id}, Active: ${m.is_active}, End Date: ${m.end_date}`);
        });
      }

      // Test 5: Test expire_memberships function
      console.log('\n5️⃣ Testing expire_memberships function...');
      return window.supabase.rpc('expire_memberships');
    })
    .then(({ error: expireError }) => {
      if (expireError) {
        console.log('❌ Error calling expire_memberships:', expireError.message);
      } else {
        console.log('✅ expire_memberships function executed successfully');
      }

      // Test 6: Test check_and_expire_memberships function
      console.log('\n6️⃣ Testing check_and_expire_memberships function...');
      return window.supabase.rpc('check_and_expire_memberships');
    })
    .then(({ error: checkError }) => {
      if (checkError) {
        console.log('❌ Error calling check_and_expire_memberships:', checkError.message);
      } else {
        console.log('✅ check_and_expire_memberships function executed successfully');
      }

      // Test 7: Check memberships after expiration
      console.log('\n7️⃣ Checking memberships after expiration...');
      return Promise.all([
        window.supabase
          .from('memberships')
          .select('id, is_active, end_date')
          .eq('is_active', true),
        window.supabase
          .from('memberships')
          .select('id, is_active, end_date')
          .eq('is_active', false)
      ]);
    })
    .then(([activeResult, expiredResult]) => {
      const { data: activeMemberships, error: activeError } = activeResult;
      const { data: expiredMemberships, error: expiredError } = expiredResult;

      if (activeError) {
        console.log('❌ Error fetching active memberships:', activeError.message);
      } else {
        console.log(`✅ Found ${activeMemberships.length} active memberships`);
      }

      if (expiredError) {
        console.log('❌ Error fetching expired memberships:', expiredError.message);
      } else {
        console.log(`✅ Found ${expiredMemberships.length} expired memberships`);
      }

      console.log('\n🎉 Test completed successfully!');
    })
    .catch(error => {
      console.log('❌ Test failed with error:', error.message);
    });
} else {
  console.log('❌ Please run this test in the browser console on a page with Supabase loaded');
}
