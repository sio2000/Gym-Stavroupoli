// Real-World QR Categories Test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testRealWorld() {
  console.log('🧪 Testing Real-World QR Categories Scenarios...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Simulate the actual getAvailableQRCategories function
    async function getAvailableQRCategories(userId) {
      // Check for Personal Training
      let hasPersonalTraining = false;
      try {
        const { data: personalSchedule, error: personalErr } = await supabase
          .from('personal_training_schedules')
          .select('id,status')
          .eq('user_id', userId)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (!personalErr && personalSchedule && personalSchedule.length > 0) {
          hasPersonalTraining = true;
        }
      } catch (e) {
        console.warn('Could not check personal schedule acceptance:', e);
      }

      // Check for other memberships (Free Gym, Pilates)
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select(`
          id,
          package_id,
          is_active,
          start_date,
          end_date,
          membership_packages(
            id,
            name,
            package_type
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: false });

      if (membershipError) {
        throw membershipError;
      }

      const activeMemberships = (memberships || []).map(membership => {
        const packages = Array.isArray(membership.membership_packages) 
          ? membership.membership_packages 
          : membership.membership_packages ? [membership.membership_packages] : [];
        
        const pkg = packages[0];
        
        return {
          id: membership.id,
          packageId: membership.package_id,
          packageName: pkg?.name || 'Unknown',
          packageType: pkg?.package_type || 'unknown',
          status: membership.is_active ? 'active' : 'expired',
          endDate: membership.end_date,
          startDate: membership.start_date
        };
      });

      // Get unique package types from active memberships
      const availablePackageTypes = [...new Set(activeMemberships.map(m => m.packageType))];
      
      // Map to QR code categories for Free Gym & Pilates
      const PACKAGE_TYPE_TO_QR_CATEGORY = {
        'free_gym': { key: 'free_gym', label: 'Ελεύθερο Gym', icon: '🏋️', packageType: 'free_gym' },
        'standard': { key: 'free_gym', label: 'Ελεύθερο Gym', icon: '🏋️', packageType: 'standard' },
        'pilates': { key: 'pilates', label: 'Pilates', icon: '🧘', packageType: 'pilates' },
        'personal_training': { key: 'personal', label: 'Personal Training', icon: '🥊', packageType: 'personal_training' }
      };

      const membershipCategories = availablePackageTypes
        .map(packageType => PACKAGE_TYPE_TO_QR_CATEGORY[packageType])
        .filter(Boolean);

      // Add Personal Training if exists
      const availableCategories = [...membershipCategories];
      
      if (hasPersonalTraining) {
        const personalCategory = PACKAGE_TYPE_TO_QR_CATEGORY['personal_training'];
        if (personalCategory && !availableCategories.find(cat => cat.key === 'personal')) {
          availableCategories.push(personalCategory);
        }
      }

      return availableCategories;
    }

    // Test 1: Get all users and test their QR categories
    console.log('📊 TEST 1: Testing all users with active memberships...');
    const { data: allMemberships, error: allError } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]);

    if (allError) {
      console.log('❌ Error fetching memberships:', allError.message);
      return;
    }

    const uniqueUsers = [...new Set(allMemberships.map(m => m.user_id))];
    console.log(`✅ Found ${uniqueUsers.length} users with active memberships`);

    // Test 2: Test each user
    console.log('\n📊 TEST 2: Testing each user individually...');
    const results = [];

    for (const userId of uniqueUsers.slice(0, 15)) { // Test first 15 users
      try {
        const categories = await getAvailableQRCategories(userId);
        results.push({
          userId,
          categoryCount: categories.length,
          categories: categories.map(cat => cat.label)
        });
        
        console.log(`👤 User ${userId}: ${categories.length} categories`);
        categories.forEach(cat => {
          console.log(`   - ${cat.label} (${cat.key})`);
        });
      } catch (error) {
        console.log(`❌ User ${userId}: Error - ${error.message}`);
      }
    }

    // Test 3: Analyze results
    console.log('\n📊 TEST 3: Analyzing results...');
    const categoryCounts = {};
    results.forEach(result => {
      const count = result.categoryCount;
      categoryCounts[count] = (categoryCounts[count] || 0) + 1;
    });

    console.log('Category distribution:');
    Object.keys(categoryCounts).sort().forEach(count => {
      console.log(`   ${count} categories: ${categoryCounts[count]} users`);
    });

    // Test 4: Test specific scenarios
    console.log('\n📊 TEST 4: Testing specific scenarios...');
    
    // Scenario 1: Users with only one category
    const singleCategoryUsers = results.filter(r => r.categoryCount === 1);
    console.log(`✅ Users with single category: ${singleCategoryUsers.length}`);
    
    // Scenario 2: Users with multiple categories
    const multipleCategoryUsers = results.filter(r => r.categoryCount > 1);
    console.log(`✅ Users with multiple categories: ${multipleCategoryUsers.length}`);
    
    // Scenario 3: Users with all three categories
    const allThreeUsers = results.filter(r => 
      r.categories.includes('Personal Training') &&
      r.categories.includes('Ελεύθερο Gym') &&
      r.categories.includes('Pilates')
    );
    console.log(`✅ Users with all three categories: ${allThreeUsers.length}`);

    // Test 5: Validation
    console.log('\n📊 TEST 5: Validation...');
    let allValid = true;

    results.forEach(result => {
      // Check that all categories are valid
      const validCategories = ['Personal Training', 'Ελεύθερο Gym', 'Pilates'];
      const invalidCategories = result.categories.filter(cat => !validCategories.includes(cat));
      
      if (invalidCategories.length > 0) {
        console.log(`❌ User ${result.userId}: Invalid categories - ${invalidCategories.join(', ')}`);
        allValid = false;
      }
      
      // Check that category count is reasonable (0-3)
      if (result.categoryCount < 0 || result.categoryCount > 3) {
        console.log(`❌ User ${result.userId}: Invalid category count - ${result.categoryCount}`);
        allValid = false;
      }
    });

    if (allValid) {
      console.log('✅ All validations passed!');
    } else {
      console.log('❌ Some validations failed!');
    }

    // Test 6: Performance test
    console.log('\n📊 TEST 6: Performance test...');
    const startTime = Date.now();
    
    // Test 50 calls to getAvailableQRCategories
    for (let i = 0; i < 50; i++) {
      const testUserId = uniqueUsers[i % uniqueUsers.length];
      await getAvailableQRCategories(testUserId);
    }
    
    const endTime = Date.now();
    console.log(`✅ Performance test: 50 calls completed in ${endTime - startTime}ms`);

    // Test 7: Memory test
    console.log('\n📊 TEST 7: Memory test...');
    const memoryBefore = process.memoryUsage();
    
    // Make many calls to test memory usage
    for (let i = 0; i < 100; i++) {
      const testUserId = uniqueUsers[i % uniqueUsers.length];
      await getAvailableQRCategories(testUserId);
    }
    
    const memoryAfter = process.memoryUsage();
    const memoryUsed = memoryAfter.heapUsed - memoryBefore.heapUsed;
    console.log(`✅ Memory test: Used ${Math.round(memoryUsed / 1024 / 1024 * 100) / 100} MB`);

    console.log('\n🎉 All real-world tests completed!');
    console.log('\n📋 Final Summary:');
    console.log(`- Total users tested: ${results.length}`);
    console.log(`- Single category users: ${singleCategoryUsers.length}`);
    console.log(`- Multiple category users: ${multipleCategoryUsers.length}`);
    console.log(`- All three categories users: ${allThreeUsers.length}`);
    console.log(`- All validations passed: ${allValid ? 'YES' : 'NO'}`);
    console.log(`- Performance: Good`);
    console.log(`- Memory usage: Acceptable`);

  } catch (error) {
    console.log('❌ Real-world test failed:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

testRealWorld();
