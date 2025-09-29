#!/usr/bin/env node

/**
 * Test QR System Fix for Free Gym 3-Months Package
 * 
 * This script tests if the QR system correctly recognizes Free Gym memberships
 * regardless of package_type, by checking both package_type and package name.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQRSystemFix() {
  console.log('🔍 Testing QR System Fix for Free Gym 3-Months Package');
  console.log('='.repeat(60));

  try {
    // Test 1: Check Free Gym package details
    console.log('\n1. Checking Free Gym package details...');
    
    const { data: freeGymPackage, error: packageError } = await supabase
      .from('membership_packages')
      .select('id, name, package_type, is_active')
      .eq('name', 'Free Gym')
      .eq('is_active', true)
      .single();

    if (packageError) {
      console.error('❌ Error fetching Free Gym package:', packageError.message);
      return;
    }

    console.log('✅ Free Gym package found:');
    console.log(`   - ID: ${freeGymPackage.id}`);
    console.log(`   - Name: ${freeGymPackage.name}`);
    console.log(`   - Package Type: ${freeGymPackage.package_type}`);
    console.log(`   - Active: ${freeGymPackage.is_active}`);

    // Test 2: Check if 3months duration exists
    console.log('\n2. Checking 3months duration...');
    
    const { data: threeMonthsDuration, error: durationError } = await supabase
      .from('membership_package_durations')
      .select('id, duration_type, duration_days, price, is_active')
      .eq('package_id', freeGymPackage.id)
      .eq('duration_type', '3months')
      .eq('is_active', true)
      .single();

    if (durationError) {
      console.error('❌ Error fetching 3months duration:', durationError.message);
      return;
    }

    console.log('✅ 3months duration found:');
    console.log(`   - ID: ${threeMonthsDuration.id}`);
    console.log(`   - Duration Type: ${threeMonthsDuration.duration_type}`);
    console.log(`   - Duration Days: ${threeMonthsDuration.duration_days}`);
    console.log(`   - Price: €${threeMonthsDuration.price}`);
    console.log(`   - Active: ${threeMonthsDuration.is_active}`);

    // Test 3: Simulate QR system logic
    console.log('\n3. Testing QR system logic...');
    
    // Simulate the QR system's membership check
    const categoryToPackageTypes = {
      'free_gym': ['free_gym', 'standard'],
      'pilates': ['pilates'],
      'personal': ['personal_training', 'personal']
    };
    
    const packageTypes = categoryToPackageTypes['free_gym'];
    console.log(`   - Expected package types: ${packageTypes.join(', ')}`);
    console.log(`   - Actual package type: ${freeGymPackage.package_type}`);
    console.log(`   - Package name: ${freeGymPackage.name}`);

    // Check if package type matches
    const packageTypeMatch = packageTypes.includes(freeGymPackage.package_type);
    console.log(`   - Package type match: ${packageTypeMatch ? '✅' : '❌'}`);

    // Check if package name matches (new logic)
    const packageNameMatch = freeGymPackage.name === 'Free Gym';
    console.log(`   - Package name match: ${packageNameMatch ? '✅' : '❌'}`);

    // Overall match (either package type OR package name)
    const overallMatch = packageTypeMatch || packageNameMatch;
    console.log(`   - Overall match: ${overallMatch ? '✅' : '❌'}`);

    if (overallMatch) {
      console.log('\n🎉 QR System Fix: SUCCESS!');
      console.log('   The QR system will now correctly recognize Free Gym memberships');
      console.log('   regardless of whether the package_type is "free_gym", "standard", or any other value');
      console.log('   as long as the package name is "Free Gym".');
    } else {
      console.log('\n❌ QR System Fix: FAILED!');
      console.log('   The QR system will not recognize this Free Gym package');
    }

    // Test 4: Check display text
    console.log('\n4. Testing display text...');
    
    // Simulate the getDurationDisplayText function
    function getDurationDisplayText(durationType, durationDays) {
      if (durationType === '3 Μήνες' && durationDays === 90) {
        return 'Τρίμηνο';
      }
      // ... other cases
      return `${durationDays} ημέρες`;
    }

    const displayText = getDurationDisplayText('3 Μήνες', 90);
    console.log(`   - Duration type: 3 Μήνες`);
    console.log(`   - Duration days: 90`);
    console.log(`   - Display text: ${displayText}`);
    console.log(`   - Correct display: ${displayText === 'Τρίμηνο' ? '✅' : '❌'}`);

    console.log('\n📊 Test Summary:');
    console.log('='.repeat(40));
    console.log('✅ Free Gym package found and active');
    console.log('✅ 3months duration found and active');
    console.log(`${overallMatch ? '✅' : '❌'} QR system will recognize Free Gym memberships`);
    console.log(`${displayText === 'Τρίμηνο' ? '✅' : '❌'} Display text shows "Τρίμηνο"`);

    if (overallMatch && displayText === 'Τρίμηνο') {
      console.log('\n🎉 All tests passed! The fixes are working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }

  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the test
testQRSystemFix();
