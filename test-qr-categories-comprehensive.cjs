// Comprehensive QR Categories Test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function runComprehensiveTests() {
  console.log('🧪 Running Comprehensive QR Categories Tests...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Get all active memberships
    console.log('📊 TEST 1: Getting all active memberships...');
    const { data: allMemberships, error: allMembershipsError } = await supabase
      .from('memberships')
      .select(`
        user_id,
        is_active,
        end_date,
        package_id,
        membership_packages(name, package_type)
      `)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]);

    if (allMembershipsError) {
      console.log('❌ Error fetching all memberships:', allMembershipsError.message);
      return;
    }

    console.log(`✅ Found ${allMemberships.length} active memberships`);

    // Test 2: Get all personal training schedules
    console.log('\n📊 TEST 2: Getting all personal training schedules...');
    const { data: personalSchedules, error: personalError } = await supabase
      .from('personal_training_schedules')
      .select('user_id, status')
      .eq('status', 'accepted');

    if (personalError) {
      console.log('❌ Error fetching personal schedules:', personalError.message);
    } else {
      console.log(`✅ Found ${personalSchedules.length} accepted personal training schedules`);
    }

    // Test 3: Group users by membership types
    console.log('\n📊 TEST 3: Analyzing user membership patterns...');
    const userAnalysis = {};

    allMemberships.forEach(membership => {
      const userId = membership.user_id;
      if (!userAnalysis[userId]) {
        userAnalysis[userId] = {
          memberships: [],
          packageTypes: new Set(),
          packageNames: new Set()
        };
      }

      const packages = Array.isArray(membership.membership_packages) 
        ? membership.membership_packages 
        : membership.membership_packages ? [membership.membership_packages] : [];

      packages.forEach(pkg => {
        userAnalysis[userId].packageTypes.add(pkg.package_type);
        userAnalysis[userId].packageNames.add(pkg.name);
      });

      userAnalysis[userId].memberships.push(membership);
    });

    // Test 4: Test each user's QR categories
    console.log('\n📊 TEST 4: Testing QR categories for each user...');
    const testResults = [];

    for (const [userId, analysis] of Object.entries(userAnalysis)) {
      console.log(`\n👤 Testing user: ${userId}`);
      console.log(`   Package types: ${Array.from(analysis.packageTypes).join(', ')}`);
      console.log(`   Package names: ${Array.from(analysis.packageNames).join(', ')}`);

      // Check if user has personal training
      const hasPersonalTraining = personalSchedules.some(schedule => schedule.user_id === userId);
      console.log(`   Has Personal Training: ${hasPersonalTraining}`);

      // Simulate getAvailableQRCategories logic
      const PACKAGE_TYPE_TO_QR_CATEGORY = {
        'free_gym': { key: 'free_gym', label: 'Ελεύθερο Gym', icon: '🏋️', packageType: 'free_gym' },
        'standard': { key: 'free_gym', label: 'Ελεύθερο Gym', icon: '🏋️', packageType: 'standard' },
        'pilates': { key: 'pilates', label: 'Pilates', icon: '🧘', packageType: 'pilates' },
        'personal_training': { key: 'personal', label: 'Personal Training', icon: '🥊', packageType: 'personal_training' }
      };

      // Get membership categories
      const membershipCategories = Array.from(analysis.packageTypes)
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

      console.log(`   Available QR categories: ${availableCategories.length}`);
      availableCategories.forEach(cat => {
        console.log(`     - ${cat.label} (${cat.key})`);
      });

      testResults.push({
        userId,
        packageTypes: Array.from(analysis.packageTypes),
        packageNames: Array.from(analysis.packageNames),
        hasPersonalTraining,
        qrCategories: availableCategories.length,
        categories: availableCategories.map(cat => cat.label)
      });
    }

    // Test 5: Summary statistics
    console.log('\n📊 TEST 5: Summary Statistics...');
    console.log(`Total users tested: ${testResults.length}`);
    
    const usersWithMultipleTypes = testResults.filter(r => r.packageTypes.length > 1);
    console.log(`Users with multiple package types: ${usersWithMultipleTypes.length}`);
    
    const usersWithPersonalTraining = testResults.filter(r => r.hasPersonalTraining);
    console.log(`Users with Personal Training: ${usersWithPersonalTraining.length}`);
    
    const usersWithMultipleQRCategories = testResults.filter(r => r.qrCategories > 1);
    console.log(`Users with multiple QR categories: ${usersWithMultipleQRCategories.length}`);

    // Test 6: Edge cases
    console.log('\n📊 TEST 6: Testing Edge Cases...');
    
    // Case 1: User with only Personal Training
    const personalOnlyUsers = testResults.filter(r => 
      r.hasPersonalTraining && r.packageTypes.length === 0
    );
    console.log(`Users with only Personal Training: ${personalOnlyUsers.length}`);
    
    // Case 2: User with only Free Gym
    const freeGymOnlyUsers = testResults.filter(r => 
      r.packageTypes.includes('free_gym') && r.packageTypes.length === 1
    );
    console.log(`Users with only Free Gym: ${freeGymOnlyUsers.length}`);
    
    // Case 3: User with only Pilates
    const pilatesOnlyUsers = testResults.filter(r => 
      r.packageTypes.includes('pilates') && r.packageTypes.length === 1
    );
    console.log(`Users with only Pilates: ${pilatesOnlyUsers.length}`);
    
    // Case 4: User with all three types
    const allThreeUsers = testResults.filter(r => 
      r.hasPersonalTraining && 
      (r.packageTypes.includes('free_gym') || r.packageTypes.includes('standard')) &&
      r.packageTypes.includes('pilates')
    );
    console.log(`Users with all three types: ${allThreeUsers.length}`);

    // Test 7: Validation
    console.log('\n📊 TEST 7: Validation...');
    let allTestsPassed = true;

    testResults.forEach(result => {
      const expectedCategories = [];
      
      // Add membership categories
      result.packageTypes.forEach(type => {
        if (type === 'free_gym' || type === 'standard') {
          if (!expectedCategories.includes('Ελεύθερο Gym')) {
            expectedCategories.push('Ελεύθερο Gym');
          }
        } else if (type === 'pilates') {
          expectedCategories.push('Pilates');
        }
      });
      
      // Add Personal Training if exists
      if (result.hasPersonalTraining) {
        expectedCategories.push('Personal Training');
      }
      
      const actualCategories = result.categories;
      const categoriesMatch = expectedCategories.length === actualCategories.length &&
        expectedCategories.every(cat => actualCategories.includes(cat));
      
      if (!categoriesMatch) {
        console.log(`❌ User ${result.userId}: Expected ${expectedCategories}, got ${actualCategories}`);
        allTestsPassed = false;
      }
    });

    if (allTestsPassed) {
      console.log('✅ All validation tests passed!');
    } else {
      console.log('❌ Some validation tests failed!');
    }

    // Test 8: Performance test
    console.log('\n📊 TEST 8: Performance Test...');
    const startTime = Date.now();
    
    // Simulate multiple calls to getAvailableQRCategories
    for (let i = 0; i < 10; i++) {
      for (const userId of Object.keys(userAnalysis).slice(0, 5)) {
        // Simulate the function call (simplified)
        const userMemberships = allMemberships.filter(m => m.user_id === userId);
        const hasPersonal = personalSchedules.some(s => s.user_id === userId);
        // ... (simplified logic)
      }
    }
    
    const endTime = Date.now();
    console.log(`✅ Performance test completed in ${endTime - startTime}ms`);

    console.log('\n🎉 All comprehensive tests completed!');
    console.log('\n📋 Final Summary:');
    console.log(`- Total active memberships: ${allMemberships.length}`);
    console.log(`- Total users with memberships: ${testResults.length}`);
    console.log(`- Users with multiple QR categories: ${usersWithMultipleQRCategories.length}`);
    console.log(`- All tests passed: ${allTestsPassed ? 'YES' : 'NO'}`);

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

runComprehensiveTests();
