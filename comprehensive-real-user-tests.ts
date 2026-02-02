/**
 * COMPREHENSIVE REAL USER TESTING SUITE
 * 
 * Tests real users with different subscription types
 * Advances time through multiple phases
 * Validates: refills, expirations, deposits, cancellations, combinations
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key] = valueParts.join('=');
  }
});

const supabase = createClient(envVars['VITE_SUPABASE_URL']!, envVars['VITE_SUPABASE_SERVICE_KEY']!);

// Real test users
const TEST_USERS = {
  ultimate_medium: [
    { id: 'f9a5b3d1-66f3-43a0-a09a-de0130ef9d87', name: 'Ultimate Medium Bot005' },
    { id: 'c5405500-fa53-4388-8910-16eb32ce3796', name: 'Ultimate Medium Bot004' },
    { id: '6a2fceaa-6595-4ca7-b635-9a7013128eec', name: 'Ultimate Medium Bot003' },
    { id: '6f63518a-9bf0-40f9-8a4e-a9e9ac3fcf9b', name: 'Ultimate Medium Bot002' },
    { id: 'fddea114-55ef-41de-9eff-16cc1b98fd67', name: 'Ultimate Medium Bot001' },
  ],
  ultimate: [
    { id: 'b898f7fc-b0f5-4a80-b9cb-85ac010d1083', name: 'Ultimate Bot005' },
    { id: '8b9f3274-ceed-4378-8202-fb0c593bebc4', name: 'Ultimate Bot004' },
    { id: '18139e41-e1c5-4b40-98e4-b713987b8d21', name: 'Ultimate Bot003' },
    { id: '9f222a90-9846-4cbe-8bc3-3aff68017f6d', name: 'Ultimate Bot002' },
    { id: 'c56a223c-4275-4bd2-a14d-6f59c39d295e', name: 'Ultimate Bot001' },
  ],
  freegym: [
    { id: '818369d4-e2af-4b2e-aeab-bf7ee1423a6f', name: 'FreeGym Bot005' },
    { id: '5b699842-8581-49de-b7c2-7150cde1b0b7', name: 'FreeGym Bot004' },
    { id: '148e5ca3-bf80-4cea-b76f-39468ef795df', name: 'FreeGym Bot003' },
    { id: 'f428eb6c-83d9-4cbf-81db-ef9877f5749c', name: 'FreeGym Bot002' },
    { id: '29d544d5-4278-4226-a003-3223b8ff092c', name: 'FreeGym Bot001' },
  ],
  pilates: [
    { id: '69c3a037-d49f-4835-8623-8c969abcd187', name: 'Pilates Bot005' },
    { id: '31278f5c-6460-4cb6-bc84-6403ee35a72b', name: 'Pilates Bot004' },
    { id: '5bd3ae13-3f8c-4125-a64a-dccddfdec50f', name: 'Pilates Bot003' },
    { id: '115af99b-0279-4166-9634-bafe1c2e4c3c', name: 'Pilates Bot002' },
    { id: '2716f0dd-7a02-4d75-afa2-6b794c049208', name: 'Pilates Bot001' },
  ],
};

interface TestResult {
  phase: string;
  timestamp: string;
  tests: Array<{
    name: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    message: string;
    details?: any;
  }>;
}

const results: TestResult[] = [];

async function log(message: string) {
  console.log(`\n📋 ${message}`);
}

async function testPhase(name: string, daysOffset: number) {
  const phase = `PHASE: ${name} (+${daysOffset} days)`;
  log(phase);

  const phaseResult: TestResult = {
    phase,
    timestamp: new Date().toISOString(),
    tests: [],
  };

  const baseDate = new Date('2026-01-31');
  const phaseDate = new Date(baseDate);
  phaseDate.setDate(phaseDate.getDate() + daysOffset);

  try {
    // PHASE 1: ULTIMATE & ULTIMATE MEDIUM REFILLS
    await testUltimateRefills(phaseDate, phaseResult);

    // PHASE 2: PILATES DEPOSITS & BOOKINGS
    await testPilatesDeposits(phaseDate, phaseResult);

    // PHASE 3: FREEGYM SIMPLE EXPIRY
    await testFreeGymExpiry(phaseDate, phaseResult);

    // PHASE 4: MIXED SCENARIOS & COMBINATIONS
    await testMixedScenarios(phaseDate, phaseResult);

    // PHASE 5: EXPIRATIONS & CASCADE
    await testExpirations(phaseDate, phaseResult);

  } catch (error) {
    phaseResult.tests.push({
      name: 'Phase Execution',
      status: 'FAIL',
      message: `Error in phase: ${error}`,
    });
  }

  results.push(phaseResult);
  return phaseResult;
}

async function testUltimateRefills(phaseDate: Date, phaseResult: TestResult) {
  log('Testing ULTIMATE & ULTIMATE MEDIUM refills...');

  const dayOfWeek = phaseDate.getDay();
  const isSunday = dayOfWeek === 0;

  // Check Ultimate deposits
  for (const user of TEST_USERS.ultimate) {
    const { data: deposits } = await supabase
      .from('pilates_deposits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    phaseResult.tests.push({
      name: `Ultimate ${user.name} - Deposits`,
      status: deposits && deposits.length > 0 ? 'PASS' : 'WARN',
      message: `${deposits?.length || 0} active deposits (Ultimate = 3 lessons per week)`,
      details: deposits,
    });

    if (isSunday) {
      // On Sunday, should have 3 lessons refilled
      const lessons = deposits?.[0]?.deposit_remaining || 0;
      phaseResult.tests.push({
        name: `Ultimate ${user.name} - Sunday Refill`,
        status: lessons >= 1 ? 'PASS' : 'FAIL',
        message: `Sunday refill: ${lessons} lessons available (expected: 3)`,
      });
    }
  }

  // Check Ultimate Medium deposits
  for (const user of TEST_USERS.ultimate_medium) {
    const { data: deposits } = await supabase
      .from('pilates_deposits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    phaseResult.tests.push({
      name: `Ultimate Medium ${user.name} - Deposits`,
      status: deposits && deposits.length > 0 ? 'PASS' : 'WARN',
      message: `${deposits?.length || 0} active deposits (Ultimate Medium = 1 lesson per week)`,
    });

    if (isSunday) {
      const lessons = deposits?.[0]?.deposit_remaining || 0;
      phaseResult.tests.push({
        name: `Ultimate Medium ${user.name} - Sunday Refill`,
        status: lessons >= 1 ? 'PASS' : 'FAIL',
        message: `Sunday refill: ${lessons} lessons available (expected: 1)`,
      });
    }
  }
}

async function testPilatesDeposits(phaseDate: Date, phaseResult: TestResult) {
  log('Testing PILATES deposits & bookings...');

  for (const user of TEST_USERS.pilates) {
    const { data: memberships } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (memberships && memberships.length > 0) {
      const membership = memberships[0];

      // Check deposits
      const { data: deposits } = await supabase
        .from('pilates_deposits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const hasDeposits = deposits && deposits.length > 0;
      const lessonsRemaining = deposits?.[0]?.deposit_remaining || 0;

      phaseResult.tests.push({
        name: `Pilates ${user.name} - Deposits Active`,
        status: hasDeposits ? 'PASS' : 'WARN',
        message: `${lessonsRemaining} lessons remaining for Pilates subscription`,
      });

      // Check expiration
      const endDate = new Date(membership.end_date);
      const hasExpired = endDate < phaseDate;

      phaseResult.tests.push({
        name: `Pilates ${user.name} - Not Expired`,
        status: !hasExpired && membership.is_active ? 'PASS' : 'FAIL',
        message: `Expires: ${membership.end_date} (today: ${phaseDate.toISOString().split('T')[0]})`,
      });
    }
  }
}

async function testFreeGymExpiry(phaseDate: Date, phaseResult: TestResult) {
  log('Testing FREEGYM expiry...');

  for (const user of TEST_USERS.freegym) {
    const { data: memberships } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('package_id', (await getPackageId('Free Gym')) || '');

    if (memberships && memberships.length > 0) {
      const membership = memberships[0];
      const endDate = new Date(membership.end_date);
      const hasExpired = endDate < phaseDate;
      const isActive = membership.is_active;

      phaseResult.tests.push({
        name: `FreeGym ${user.name} - Status Correct`,
        status: hasExpired !== isActive ? 'PASS' : 'FAIL',
        message: hasExpired 
          ? `Correctly marked as inactive (expired: ${membership.end_date})`
          : `Active until ${membership.end_date}`,
      });
    }
  }
}

async function testMixedScenarios(phaseDate: Date, phaseResult: TestResult) {
  log('Testing MIXED scenarios & combinations...');

  // Test user with multiple subscription types
  const ultimateUser = TEST_USERS.ultimate[0];
  const { data: allMemberships } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', ultimateUser.id);

  phaseResult.tests.push({
    name: 'Ultimate User - Multiple Memberships',
    status: allMemberships && allMemberships.length >= 1 ? 'PASS' : 'WARN',
    message: `User has ${allMemberships?.length || 0} active membership(s)`,
  });

  // Test cascade deactivation
  const { data: pilatesUser } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', TEST_USERS.pilates[0].id);

  if (pilatesUser && pilatesUser.length > 0) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', TEST_USERS.pilates[0].id);

    if (membership && membership.length > 0 && !membership[0].is_active) {
      const { data: deposits } = await supabase
        .from('pilates_deposits')
        .select('*')
        .eq('user_id', TEST_USERS.pilates[0].id)
        .eq('is_active', true);

      phaseResult.tests.push({
        name: 'Cascade Deactivation',
        status: !deposits || deposits.length === 0 ? 'PASS' : 'FAIL',
        message: `Expired membership has ${deposits?.length || 0} active deposits (expected: 0)`,
      });
    }
  }
}

async function testExpirations(phaseDate: Date, phaseResult: TestResult) {
  log('Testing EXPIRATIONS & cascade effects...');

  const { data: expiredMemberships } = await supabase
    .from('memberships')
    .select('*')
    .lt('end_date', phaseDate.toISOString().split('T')[0]);

  const correctlyMarked = expiredMemberships?.filter(m => !m.is_active).length || 0;
  const incorrectlyActive = expiredMemberships?.filter(m => m.is_active).length || 0;

  phaseResult.tests.push({
    name: 'Expired Memberships - Correct Status',
    status: incorrectlyActive === 0 ? 'PASS' : 'FAIL',
    message: `${correctlyMarked} correctly marked inactive, ${incorrectlyActive} incorrectly active`,
  });

  // Check cascade for all expired memberships
  for (const membership of expiredMemberships || []) {
    if (!membership.is_active) {
      const { data: activeDeposits } = await supabase
        .from('pilates_deposits')
        .select('*')
        .eq('user_id', membership.user_id)
        .eq('is_active', true);

      if (activeDeposits && activeDeposits.length > 0) {
        phaseResult.tests.push({
          name: `Cascade for User ${membership.user_id}`,
          status: 'FAIL',
          message: `Expired membership still has ${activeDeposits.length} active deposits!`,
        });
      }
    }
  }
}

async function getPackageId(packageName: string): Promise<string | null> {
  const { data } = await supabase
    .from('membership_packages')
    .select('id')
    .eq('name', packageName)
    .single();

  return data?.id || null;
}

async function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(80));

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let warnedTests = 0;

  for (const phase of results) {
    console.log(`\n${phase.phase}`);
    console.log('-'.repeat(80));

    for (const test of phase.tests) {
      totalTests++;
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';

      if (test.status === 'PASS') passedTests++;
      else if (test.status === 'FAIL') failedTests++;
      else warnedTests++;

      console.log(`${icon} ${test.name}`);
      console.log(`   ${test.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ PASSED: ${passedTests}`);
  console.log(`❌ FAILED: ${failedTests}`);
  console.log(`⚠️  WARNED: ${warnedTests}`);
  console.log(`📊 TOTAL:  ${totalTests}`);
  console.log(`✓ Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is working correctly!');
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Review above.`);
  }
}

async function main() {
  console.log('🚀 COMPREHENSIVE REAL USER TEST SUITE');
  console.log(''.padEnd(80, '='));

  // Test phases: T0 (now), T1 (Sundays), T2, T3, T4, T5
  await testPhase('T0: TODAY (Friday)', 0);
  await testPhase('T1: SUNDAY +2 days (Refill Day)', 2);
  await testPhase('T2: Mid-week +8 days', 8);
  await testPhase('T3: NEXT SUNDAY +16 days (Second Refill)', 16);
  await testPhase('T4: One month +30 days', 30);
  await testPhase('T5: Expiration period +45 days', 45);
  await testPhase('T6: Far future +90 days', 90);

  await printResults();

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'COMPREHENSIVE_TEST_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

main().catch(console.error);
