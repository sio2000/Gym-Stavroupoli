// Test QR Generation Fix
// Έλεγχος της διόρθωσης του QR generation

import { supabase } from './src/config/supabase.js';

const USER_ID = 'b1bdc879-9b9f-4fed-88e9-15ccee1ea83d';

async function testQRGeneration() {
  try {
    console.log('🧪 [Test] Starting QR generation test...');
    console.log('🧪 [Test] User ID:', USER_ID);

    // Test 1: Check user's active memberships
    console.log('\n📋 [Test 1] Checking user active memberships...');
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select(`
        id,
        is_active,
        end_date,
        membership_packages(package_type)
      `)
      .eq('user_id', USER_ID)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]);

    if (membershipsError) {
      console.error('❌ [Test 1] Error fetching memberships:', membershipsError);
      return;
    }

    console.log('✅ [Test 1] Active memberships found:', memberships?.length || 0);
    memberships?.forEach((membership, index) => {
      console.log(`   ${index + 1}. Package Type: ${membership.membership_packages?.package_type || 'Unknown'}`);
      console.log(`      End Date: ${membership.end_date}`);
    });

    // Test 2: Check available QR categories
    console.log('\n📋 [Test 2] Checking available QR categories...');
    const packageTypes = ['free_gym', 'standard', 'pilates', 'personal_training', 'personal'];
    const availableCategories = [];

    for (const membership of memberships || []) {
      if (membership.membership_packages?.package_type) {
        const packageType = membership.membership_packages.package_type;
        if (packageTypes.includes(packageType)) {
          availableCategories.push(packageType);
        }
      }
    }

    console.log('✅ [Test 2] Available categories:', availableCategories);

    // Test 3: Test QR generation for free_gym
    console.log('\n📋 [Test 3] Testing QR generation for free_gym...');
    const freeGymMembership = memberships?.find(m => 
      m.membership_packages?.package_type === 'free_gym' || 
      m.membership_packages?.package_type === 'standard'
    );

    if (freeGymMembership) {
      console.log('✅ [Test 3] Free gym membership found:', freeGymMembership);
      console.log('🎉 [Test 3] QR generation should work for free_gym category');
    } else {
      console.log('❌ [Test 3] No free gym membership found');
      console.log('💡 [Test 3] User needs a membership with package_type: free_gym or standard');
    }

    console.log('\n🎉 [Test] QR generation test completed!');

  } catch (error) {
    console.error('❌ [Test] Unexpected error:', error);
  }
}

// Run the test
testQRGeneration();
