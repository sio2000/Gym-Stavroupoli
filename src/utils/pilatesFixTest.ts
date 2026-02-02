// =====================================================
// PILATES SUBSCRIPTION FIX - TEST UTILITY
// =====================================================
// This file provides test functions to verify the Pilates fix
// Run these tests from the browser console after logging in
//
// USAGE:
//   import { runPilatesFixTests } from '@/utils/pilatesFixTest';
//   runPilatesFixTests();
// =====================================================

import { supabase } from '@/config/supabase';
import {
  getPilatesSubscriptionStatus,
  runPilatesExpirationCheck,
  canUserBookPilatesClass,
  getActivePilatesDeposit,
  hasActivePilatesMembership,
} from './pilatesScheduleApi';
import {
  expirePilatesSubscriptions,
  getUserActiveMembershipsDeterministic,
  userHasQRAccess,
  getPilatesSubscriptionDetails,
} from './membershipExpiration';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

// Test 1: Verify expiration check runs without errors
async function testExpirationCheck(): Promise<TestResult> {
  console.log('[PILATES-FIX-TEST] Running expiration check test...');
  try {
    const result = await runPilatesExpirationCheck();
    return {
      name: 'Expiration Check',
      passed: true,
      message: 'Expiration check completed successfully',
      details: result
    };
  } catch (error) {
    return {
      name: 'Expiration Check',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

// Test 2: Verify subscription status retrieval
async function testSubscriptionStatus(userId: string): Promise<TestResult> {
  console.log('[PILATES-FIX-TEST] Testing subscription status...');
  try {
    const status = await getPilatesSubscriptionStatus(userId);
    
    if (!status) {
      return {
        name: 'Subscription Status',
        passed: true,
        message: 'No active Pilates subscription found (this is valid)',
        details: { userId, status: null }
      };
    }
    
    return {
      name: 'Subscription Status',
      passed: true,
      message: status.status_message,
      details: {
        has_active_membership: status.has_active_membership,
        membership_end_date: status.membership_end_date,
        membership_days_remaining: status.membership_days_remaining,
        has_active_deposit: status.has_active_deposit,
        deposit_remaining: status.deposit_remaining,
        can_book: status.can_book_pilates_class,
        can_access: status.can_access_gym_via_pilates
      }
    };
  } catch (error) {
    return {
      name: 'Subscription Status',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

// Test 3: Verify booking eligibility check
async function testBookingEligibility(userId: string): Promise<TestResult> {
  console.log('[PILATES-FIX-TEST] Testing booking eligibility...');
  try {
    const result = await canUserBookPilatesClass(userId);
    return {
      name: 'Booking Eligibility',
      passed: true,
      message: result.reason,
      details: { canBook: result.canBook }
    };
  } catch (error) {
    return {
      name: 'Booking Eligibility',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

// Test 4: Verify deposit retrieval
async function testDepositRetrieval(userId: string): Promise<TestResult> {
  console.log('[PILATES-FIX-TEST] Testing deposit retrieval...');
  try {
    const deposit = await getActivePilatesDeposit(userId);
    return {
      name: 'Deposit Retrieval',
      passed: true,
      message: deposit ? `Active deposit: ${deposit.deposit_remaining} classes remaining` : 'No active deposit',
      details: deposit
    };
  } catch (error) {
    return {
      name: 'Deposit Retrieval',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

// Test 5: Verify membership check
async function testMembershipCheck(userId: string): Promise<TestResult> {
  console.log('[PILATES-FIX-TEST] Testing membership check...');
  try {
    const hasActive = await hasActivePilatesMembership(userId);
    return {
      name: 'Membership Check',
      passed: true,
      message: hasActive ? 'Has active Pilates membership' : 'No active Pilates membership',
      details: { hasActiveMembership: hasActive }
    };
  } catch (error) {
    return {
      name: 'Membership Check',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

// Test 6: Verify deterministic membership query
async function testDeterministicMemberships(userId: string): Promise<TestResult> {
  console.log('[PILATES-FIX-TEST] Testing deterministic memberships...');
  try {
    const memberships = await getUserActiveMembershipsDeterministic(userId);
    return {
      name: 'Deterministic Memberships',
      passed: true,
      message: `Found ${memberships.length} active membership(s)`,
      details: memberships
    };
  } catch (error) {
    return {
      name: 'Deterministic Memberships',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

// Test 7: Verify QR access check
async function testQRAccess(userId: string): Promise<TestResult> {
  console.log('[PILATES-FIX-TEST] Testing QR access...');
  try {
    const hasAccess = await userHasQRAccess(userId);
    return {
      name: 'QR Access',
      passed: true,
      message: hasAccess ? 'User has QR access' : 'User does NOT have QR access',
      details: { hasQRAccess: hasAccess }
    };
  } catch (error) {
    return {
      name: 'QR Access',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

// Test 8: Verify comprehensive Pilates details
async function testPilatesDetails(userId: string): Promise<TestResult> {
  console.log('[PILATES-FIX-TEST] Testing Pilates subscription details...');
  try {
    const details = await getPilatesSubscriptionDetails(userId);
    
    if (!details) {
      return {
        name: 'Pilates Details',
        passed: false,
        message: 'Failed to get Pilates subscription details',
        details: null
      };
    }
    
    // Check for anomalies
    if (details.hasAnomalies) {
      return {
        name: 'Pilates Details',
        passed: false,
        message: `ANOMALIES DETECTED: ${details.memberships.anomalies} membership anomalies, ${details.deposits.anomalies} deposit anomalies`,
        details: details
      };
    }
    
    return {
      name: 'Pilates Details',
      passed: true,
      message: `Active: ${details.memberships.active} memberships, ${details.deposits.totalRemaining} classes remaining`,
      details: details
    };
  } catch (error) {
    return {
      name: 'Pilates Details',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

// Test 9: Check for database anomalies (memberships marked active but expired)
async function testDatabaseAnomalies(): Promise<TestResult> {
  console.log('[PILATES-FIX-TEST] Checking for database anomalies...');
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check for memberships marked active but end_date in past
    const { data: membershipAnomalies, error: membershipError } = await supabase
      .from('memberships')
      .select('id, user_id, status, is_active, end_date')
      .eq('status', 'active')
      .lt('end_date', today);
    
    if (membershipError) {
      throw membershipError;
    }
    
    // Check for deposits marked active but expired
    const now = new Date().toISOString();
    const { data: depositAnomalies, error: depositError } = await supabase
      .from('pilates_deposits')
      .select('id, user_id, is_active, deposit_remaining, expires_at')
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .lt('expires_at', now);
    
    if (depositError) {
      throw depositError;
    }
    
    const totalAnomalies = (membershipAnomalies?.length || 0) + (depositAnomalies?.length || 0);
    
    if (totalAnomalies > 0) {
      return {
        name: 'Database Anomalies',
        passed: false,
        message: `FOUND ${totalAnomalies} ANOMALIES: ${membershipAnomalies?.length || 0} memberships, ${depositAnomalies?.length || 0} deposits`,
        details: {
          membershipAnomalies: membershipAnomalies?.slice(0, 5),
          depositAnomalies: depositAnomalies?.slice(0, 5),
          totalMembershipAnomalies: membershipAnomalies?.length || 0,
          totalDepositAnomalies: depositAnomalies?.length || 0
        }
      };
    }
    
    return {
      name: 'Database Anomalies',
      passed: true,
      message: 'No anomalies found - database is clean',
      details: { anomaliesFound: 0 }
    };
  } catch (error) {
    return {
      name: 'Database Anomalies',
      passed: false,
      message: `Error checking anomalies: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

// Test 10: Verify expiration happens for overdue records
async function testExpirationExecution(): Promise<TestResult> {
  console.log('[PILATES-FIX-TEST] Testing expiration execution...');
  try {
    // First check for anomalies
    const beforeCheck = await testDatabaseAnomalies();
    const anomaliesBefore = beforeCheck.details?.totalMembershipAnomalies + beforeCheck.details?.totalDepositAnomalies || 0;
    
    // Run expiration
    const result = await expirePilatesSubscriptions();
    
    // Check again
    const afterCheck = await testDatabaseAnomalies();
    const anomaliesAfter = afterCheck.details?.totalMembershipAnomalies + afterCheck.details?.totalDepositAnomalies || 0;
    
    if (anomaliesAfter > 0) {
      return {
        name: 'Expiration Execution',
        passed: false,
        message: `Expiration ran but ${anomaliesAfter} anomalies remain`,
        details: {
          expirationResult: result,
          anomaliesBefore,
          anomaliesAfter
        }
      };
    }
    
    return {
      name: 'Expiration Execution',
      passed: true,
      message: `Expiration successful: ${result.expiredCount} memberships, ${result.expiredDeposits || 0} deposits expired`,
      details: {
        expirationResult: result,
        anomaliesBefore,
        anomaliesAfter
      }
    };
  } catch (error) {
    return {
      name: 'Expiration Execution',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

// Main test runner
export async function runPilatesFixTests(userId?: string): Promise<void> {
  console.log('=====================================================');
  console.log('PILATES SUBSCRIPTION FIX - TEST SUITE');
  console.log('=====================================================');
  console.log('Timestamp:', new Date().toISOString());
  
  // Get current user if not provided
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user logged in. Please log in first or provide a userId.');
      return;
    }
    userId = user.id;
  }
  
  console.log('Testing for user:', userId);
  console.log('=====================================================\n');
  
  const results: TestResult[] = [];
  
  // Run all tests
  results.push(await testExpirationCheck());
  results.push(await testDatabaseAnomalies());
  results.push(await testExpirationExecution());
  results.push(await testSubscriptionStatus(userId));
  results.push(await testBookingEligibility(userId));
  results.push(await testDepositRetrieval(userId));
  results.push(await testMembershipCheck(userId));
  results.push(await testDeterministicMemberships(userId));
  results.push(await testQRAccess(userId));
  results.push(await testPilatesDetails(userId));
  
  // Print results
  console.log('\n=====================================================');
  console.log('TEST RESULTS');
  console.log('=====================================================\n');
  
  let passedCount = 0;
  let failedCount = 0;
  
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    const status = result.passed ? 'PASSED' : 'FAILED';
    console.log(`${index + 1}. ${icon} ${result.name}: ${status}`);
    console.log(`   Message: ${result.message}`);
    if (!result.passed && result.details) {
      console.log('   Details:', result.details);
    }
    console.log('');
    
    if (result.passed) passedCount++;
    else failedCount++;
  });
  
  console.log('=====================================================');
  console.log(`SUMMARY: ${passedCount} passed, ${failedCount} failed`);
  console.log('=====================================================');
  
  if (failedCount === 0) {
    console.log('🎉 ALL TESTS PASSED! The Pilates fix is working correctly.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Review the details above.');
  }
}

// Export individual tests for granular testing
export {
  testExpirationCheck,
  testSubscriptionStatus,
  testBookingEligibility,
  testDepositRetrieval,
  testMembershipCheck,
  testDeterministicMemberships,
  testQRAccess,
  testPilatesDetails,
  testDatabaseAnomalies,
  testExpirationExecution,
};
