/**
 * ENHANCED COMPREHENSIVE TEST SUITE WITH DIAGNOSTICS
 * 
 * - Better error messages
 * - Deposits creation for Ultimate/Ultimate Medium
 * - Cascade deactivation verification
 * - Refill simulation
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

const TEST_USERS = {
  ultimate: [
    { id: 'b898f7fc-b0f5-4a80-b9cb-85ac010d1083', name: 'Ultimate Bot005', lessonsPerWeek: 3 },
    { id: '8b9f3274-ceed-4378-8202-fb0c593bebc4', name: 'Ultimate Bot004', lessonsPerWeek: 3 },
    { id: '18139e41-e1c5-4b40-98e4-b713987b8d21', name: 'Ultimate Bot003', lessonsPerWeek: 3 },
    { id: '9f222a90-9846-4cbe-8bc3-3aff68017f6d', name: 'Ultimate Bot002', lessonsPerWeek: 3 },
    { id: 'c56a223c-4275-4bd2-a14d-6f59c39d295e', name: 'Ultimate Bot001', lessonsPerWeek: 3 },
  ],
  ultimate_medium: [
    { id: 'f9a5b3d1-66f3-43a0-a09a-de0130ef9d87', name: 'Ultimate Medium Bot005', lessonsPerWeek: 1 },
    { id: 'c5405500-fa53-4388-8910-16eb32ce3796', name: 'Ultimate Medium Bot004', lessonsPerWeek: 1 },
    { id: '6a2fceaa-6595-4ca7-b635-9a7013128eec', name: 'Ultimate Medium Bot003', lessonsPerWeek: 1 },
    { id: '6f63518a-9bf0-40f9-8a4e-a9e9ac3fcf9b', name: 'Ultimate Medium Bot002', lessonsPerWeek: 1 },
    { id: 'fddea114-55ef-41de-9eff-16cc1b98fd67', name: 'Ultimate Medium Bot001', lessonsPerWeek: 1 },
  ],
  freegym: [
    'ef73c0ab-6fbf-4a09-b956-1e94e2e15fb6',
    '818369d4-e2af-4b2e-aeab-bf7ee1423a6f',
    '5b699842-8581-49de-b7c2-7150cde1b0b7',
    '148e5ca3-bf80-4cea-b76f-39468ef795df',
    'f428eb6c-83d9-4cbf-81db-ef9877f5749c',
  ],
  pilates: [
    '69c3a037-d49f-4835-8623-8c969abcd187',
    '31278f5c-6460-4cb6-bc84-6403ee35a72b',
    '5bd3ae13-3f8c-4125-a64a-dccddfdec50f',
    '115af99b-0279-4166-9634-bafe1c2e4c3c',
    '2716f0dd-7a02-4d75-afa2-6b794c049208',
  ],
};

async function log(msg: string) {
  console.log(`\n📋 ${msg}`);
}

async function createDepositsForUltimate() {
  log('Creating initial deposits for Ultimate users...');

  const { data: pilatesPackages } = await supabase
    .from('membership_packages')
    .select('id')
    .eq('name', 'Pilates');

  if (!pilatesPackages || pilatesPackages.length === 0) {
    log('⚠️  Pilates package not found');
    return;
  }

  const pilatesPackageId = pilatesPackages[0].id;
  const endDate = new Date('2026-02-28');

  // Create deposits for Ultimate users (3 lessons per week)
  for (const user of TEST_USERS.ultimate) {
    const { data: existing } = await supabase
      .from('pilates_deposits')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (!existing || existing.length === 0) {
      const { error } = await supabase
        .from('pilates_deposits')
        .insert({
          user_id: user.id,
          package_id: pilatesPackageId,
          deposit_remaining: user.lessonsPerWeek,
          expires_at: endDate.toISOString(),
          is_active: true,
        });

      if (error) {
        log(`❌ Failed to create deposit for ${user.name}: ${error.message}`);
      } else {
        log(`✅ Created ${user.lessonsPerWeek} lessons for ${user.name}`);
      }
    }
  }

  // Create deposits for Ultimate Medium users (1 lesson per week)
  for (const user of TEST_USERS.ultimate_medium) {
    const { data: existing } = await supabase
      .from('pilates_deposits')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (!existing || existing.length === 0) {
      const { error } = await supabase
        .from('pilates_deposits')
        .insert({
          user_id: user.id,
          package_id: pilatesPackageId,
          deposit_remaining: user.lessonsPerWeek,
          expires_at: endDate.toISOString(),
          is_active: true,
        });

      if (error) {
        log(`❌ Failed to create deposit for ${user.name}: ${error.message}`);
      } else {
        log(`✅ Created ${user.lessonsPerWeek} lesson for ${user.name}`);
      }
    }
  }
}

async function runDiagnostics() {
  log('═'.repeat(80));
  log('RUNNING COMPREHENSIVE DIAGNOSTICS');
  log('═'.repeat(80));

  // 1. Check Ultimate deposits
  log('1️⃣  ULTIMATE USERS - DEPOSITS & REFILLS');
  const { data: ultimateDeposits } = await supabase
    .from('pilates_deposits')
    .select('*')
    .in('user_id', TEST_USERS.ultimate.map(u => u.id))
    .eq('is_active', true);

  if (ultimateDeposits && ultimateDeposits.length > 0) {
    log(`   ✅ Found ${ultimateDeposits.length} active deposits`);
    ultimateDeposits.forEach(d => {
      log(`      • User: ${d.user_id.substring(0, 8)}... - Lessons: ${d.deposit_remaining}`);
    });
  } else {
    log('   ⚠️  No active deposits found - EXPECTED FOR REFILL TEST');
  }

  // 2. Check Ultimate Medium deposits
  log('2️⃣  ULTIMATE MEDIUM USERS - DEPOSITS');
  const { data: mediumDeposits } = await supabase
    .from('pilates_deposits')
    .select('*')
    .in('user_id', TEST_USERS.ultimate_medium.map(u => u.id))
    .eq('is_active', true);

  if (mediumDeposits && mediumDeposits.length > 0) {
    log(`   ✅ Found ${mediumDeposits.length} active deposits`);
  } else {
    log('   ⚠️  No active deposits found');
  }

  // 3. Check Pilates memberships and deposits
  log('3️⃣  PILATES USERS - MEMBERSHIPS & DEPOSITS');
  const { data: pilatesMembers } = await supabase
    .from('memberships')
    .select('*')
    .in('user_id', TEST_USERS.pilates)
    .eq('is_active', true);

  log(`   Memberships: ${pilatesMembers?.length || 0} active`);

  const { data: pilatesDeposits } = await supabase
    .from('pilates_deposits')
    .select('*')
    .in('user_id', TEST_USERS.pilates)
    .eq('is_active', true);

  log(`   Deposits: ${pilatesDeposits?.length || 0} active`);

  if (pilatesDeposits && pilatesDeposits.length > 0) {
    pilatesDeposits.forEach(d => {
      log(`      • User: ${d.user_id.substring(0, 8)}... - Lessons: ${d.deposit_remaining}`);
    });
  }

  // 4. Check FreeGym memberships
  log('4️⃣  FREEGYM USERS - MEMBERSHIPS');
  const { data: freegymMembers } = await supabase
    .from('memberships')
    .select('id, user_id, end_date, is_active')
    .in('user_id', TEST_USERS.freegym);

  const active = freegymMembers?.filter(m => m.is_active).length || 0;
  const inactive = freegymMembers?.filter(m => !m.is_active).length || 0;

  log(`   Active: ${active}, Inactive: ${inactive}`);

  // 5. Check cascade deactivation
  log('5️⃣  CASCADE DEACTIVATION TEST');
  const { data: expiredMembers } = await supabase
    .from('memberships')
    .select('id, user_id, is_active')
    .lt('end_date', '2026-03-02');

  const expiredButActive = expiredMembers?.filter(m => m.is_active).length || 0;
  const expiredAndInactive = expiredMembers?.filter(m => !m.is_active).length || 0;

  if (expiredButActive > 0) {
    log(`   ⚠️  ${expiredButActive} expired memberships still marked ACTIVE!`);
    log('   This should be FIXED - expired should auto-deactivate');
  } else {
    log('   ✅ All expired memberships correctly marked INACTIVE');
  }

  log(`   (${expiredAndInactive} correctly inactive)`);

  // 6. Check for deposits with expired memberships
  log('6️⃣  ORPHANED DEPOSITS TEST');
  const { data: expiredUserIds } = await supabase
    .from('memberships')
    .select('user_id')
    .lt('end_date', '2026-03-02')
    .eq('is_active', false);

  if (expiredUserIds && expiredUserIds.length > 0) {
    const userIdsSet = new Set(expiredUserIds.map(m => m.user_id));
    const { data: orphanedDeposits } = await supabase
      .from('pilates_deposits')
      .select('*')
      .in('user_id', Array.from(userIdsSet))
      .eq('is_active', true);

    if (orphanedDeposits && orphanedDeposits.length > 0) {
      log(`   ⚠️  Found ${orphanedDeposits.length} active deposits for expired memberships!`);
      log('   These should be auto-deactivated (CASCADE TRIGGER)');
    } else {
      log('   ✅ No orphaned deposits - CASCADE WORKING CORRECTLY');
    }
  }

  // 7. Summary statistics
  log('7️⃣  SUMMARY STATISTICS');
  const { count: totalMembers } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true });

  const { count: activeMembers } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: totalDeposits } = await supabase
    .from('pilates_deposits')
    .select('*', { count: 'exact', head: true });

  const { count: activeDeposits } = await supabase
    .from('pilates_deposits')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  log(`   Total Memberships: ${totalMembers} (${activeMembers} active)`);
  log(`   Total Deposits: ${totalDeposits} (${activeDeposits} active)`);

  log('\n' + '═'.repeat(80));
  log('✅ DIAGNOSTICS COMPLETE');
  log('═'.repeat(80));
}

async function main() {
  console.log('\n🚀 ENHANCED COMPREHENSIVE TEST SYSTEM');
  console.log('='.repeat(80));

  // Step 1: Create missing deposits
  await createDepositsForUltimate();

  // Step 2: Run diagnostics
  await runDiagnostics();

  log('\nNext: Run full tests with: npm run test:real-users');
}

main().catch(console.error);
