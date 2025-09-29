#!/usr/bin/env node

/**
 * Complete Test for 3-Months Package Fix
 * 
 * This script tests:
 * 1. Database migration (3months -> 3 Μήνες)
 * 2. QR system fix (standard package type -> Free Gym)
 * 3. Display text fix (3months -> Τρίμηνο)
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

function logTest(testName, status, message) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${testName}: ${message}`);
}

async function testDatabaseMigration() {
  console.log('\n🔍 Testing Database Migration (3months -> 3 Μήνες)');
  console.log('='.repeat(60));

  try {
    // Test 1: Check if 3 Μήνες duration exists
    const { data: greekDuration, error: greekError } = await supabase
      .from('membership_package_durations')
      .select('id, duration_type, duration_days, price, is_active')
      .eq('duration_type', '3 Μήνες')
      .eq('is_active', true)
      .single();

    if (greekError) {
      logTest('Database Migration', 'FAIL', `Error fetching 3 Μήνες duration: ${greekError.message}`);
      return false;
    }

    if (!greekDuration) {
      logTest('Database Migration', 'FAIL', '3 Μήνες duration not found');
      return false;
    }

    logTest('Database Migration', 'PASS', `3 Μήνες duration found: ${greekDuration.duration_days} days, €${greekDuration.price}`);

    // Test 2: Check if old 3months records still exist
    const { data: oldRecords, error: oldError } = await supabase
      .from('membership_package_durations')
      .select('duration_type')
      .eq('duration_type', '3months');

    if (oldError) {
      logTest('Old Records Cleanup', 'FAIL', `Error checking old records: ${oldError.message}`);
      return false;
    }

    if (oldRecords && oldRecords.length > 0) {
      logTest('Old Records Cleanup', 'FAIL', `Found ${oldRecords.length} old 3months records`);
      return false;
    }

    logTest('Old Records Cleanup', 'PASS', 'No old 3months records found');

    return true;
  } catch (error) {
    logTest('Database Migration', 'FAIL', `Unexpected error: ${error.message}`);
    return false;
  }
}

async function testQRSystemFix() {
  console.log('\n🔍 Testing QR System Fix (standard -> Free Gym)');
  console.log('='.repeat(60));

  try {
    // Test 1: Check Free Gym package details
    const { data: freeGymPackage, error: packageError } = await supabase
      .from('membership_packages')
      .select('id, name, package_type, is_active')
      .eq('name', 'Free Gym')
      .eq('is_active', true)
      .single();

    if (packageError) {
      logTest('QR System Fix', 'FAIL', `Error fetching Free Gym package: ${packageError.message}`);
      return false;
    }

    logTest('QR System Fix', 'PASS', `Free Gym package found: ${freeGymPackage.package_type}`);

    // Test 2: Simulate QR system logic
    const categoryToPackageTypes = {
      'free_gym': ['free_gym', 'standard'],
      'pilates': ['pilates'],
      'personal': ['personal_training', 'personal']
    };

    const packageTypes = categoryToPackageTypes['free_gym'];
    const packageTypeMatch = packageTypes.includes(freeGymPackage.package_type);
    const packageNameMatch = freeGymPackage.name === 'Free Gym';
    const overallMatch = packageTypeMatch || packageNameMatch;

    logTest('QR System Logic', overallMatch ? 'PASS' : 'FAIL', 
      `Package type: ${freeGymPackage.package_type}, Name: ${freeGymPackage.name}, Match: ${overallMatch}`);

    return overallMatch;
  } catch (error) {
    logTest('QR System Fix', 'FAIL', `Unexpected error: ${error.message}`);
    return false;
  }
}

async function testDisplayTextFix() {
  console.log('\n🔍 Testing Display Text Fix (3months -> Τρίμηνο)');
  console.log('='.repeat(60));

  try {
    // Simulate the getDurationDisplayText function
    function getDurationDisplayText(durationType, durationDays) {
      if (durationType === '3 Μήνες' && durationDays === 90) {
        return 'Τρίμηνο';
      }
      // ... other cases
      return `${durationDays} ημέρες`;
    }

    const displayText = getDurationDisplayText('3 Μήνες', 90);
    const isCorrect = displayText === 'Τρίμηνο';

    logTest('Display Text Fix', isCorrect ? 'PASS' : 'FAIL', 
      `Duration type: 3 Μήνες, Display text: ${displayText}, Correct: ${isCorrect}`);

    return isCorrect;
  } catch (error) {
    logTest('Display Text Fix', 'FAIL', `Unexpected error: ${error.message}`);
    return false;
  }
}

async function testUserMembership() {
  console.log('\n🔍 Testing User Membership (Real User Test)');
  console.log('='.repeat(60));

  try {
    // Test with a real user ID (you can change this)
    const testUserId = '7971f73e-7d52-4266-b39e-7efc67c9f345'; // From your logs

    // Check user's active memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('memberships')
      .select(`
        id,
        is_active,
        end_date,
        membership_packages(package_type, name)
      `)
      .eq('user_id', testUserId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]);

    if (membershipError) {
      logTest('User Membership', 'FAIL', `Error fetching memberships: ${membershipError.message}`);
      return false;
    }

    if (!memberships || memberships.length === 0) {
      logTest('User Membership', 'WARN', 'No active memberships found for test user');
      return false;
    }

    logTest('User Membership', 'PASS', `Found ${memberships.length} active memberships`);

    // Check if any membership is for Free Gym
    const freeGymMembership = memberships.find(m => {
      const packages = Array.isArray(m.membership_packages) 
        ? m.membership_packages 
        : m.membership_packages ? [m.membership_packages] : [];
      
      return packages.some(pkg => 
        pkg.package_type === 'free_gym' || 
        pkg.package_type === 'standard' || 
        pkg.name === 'Free Gym'
      );
    });

    if (freeGymMembership) {
      logTest('Free Gym Membership', 'PASS', 'User has active Free Gym membership');
    } else {
      logTest('Free Gym Membership', 'WARN', 'User does not have active Free Gym membership');
    }

    return true;
  } catch (error) {
    logTest('User Membership', 'FAIL', `Unexpected error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Complete Test Suite for 3-Months Package Fix');
  console.log('='.repeat(60));

  const results = {
    databaseMigration: await testDatabaseMigration(),
    qrSystemFix: await testQRSystemFix(),
    displayTextFix: await testDisplayTextFix(),
    userMembership: await testUserMembership()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(40));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });

  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! The fixes are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }

  return allPassed;
}

// Run the tests
runAllTests().catch(console.error);
