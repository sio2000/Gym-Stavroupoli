// Check Ultimate and Ultimate Medium users with Pilates deposits
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkUltimatePilates() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ΕΛΕΓΧΟΣ ULTIMATE USERS - PILATES DEPOSITS                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Get all deposits with package info
  const { data: deposits } = await supabase
    .from('pilates_deposits')
    .select(`
      id,
      user_id,
      package_id,
      deposit_remaining,
      is_active,
      credited_at,
      expires_at,
      user:user_profiles(first_name, last_name, email),
      package:pilates_packages(name)
    `)
    .eq('is_active', true);

  if (!deposits || deposits.length === 0) {
    console.log('❌ No active deposits found');
    return;
  }

  // Filter Ultimate and Ultimate Medium
  const ultimateUsers = deposits.filter(d => 
    d.package?.name === 'Ultimate' || d.package?.name === 'Ultimate Medium'
  );

  console.log(`📊 Found ${ultimateUsers.length} Ultimate/Ultimate Medium users with Pilates deposits\n`);

  if (ultimateUsers.length === 0) {
    console.log('✅ No Ultimate users found with Pilates deposits');
    return;
  }

  // Check each Ultimate user
  ultimateUsers.forEach((deposit, i) => {
    console.log(`${i + 1}. ${deposit.user?.first_name} ${deposit.user?.last_name}`);
    console.log(`   Email: ${deposit.user?.email}`);
    console.log(`   Package: ${deposit.package?.name}`);
    console.log(`   Pilates Deposit: ${deposit.deposit_remaining} μαθήματα`);
    console.log(`   Credited: ${deposit.credited_at}`);
    console.log(`   Expires: ${deposit.expires_at}`);

    // Check if amount is correct
    const packageName = deposit.package?.name;
    if (packageName === 'Ultimate' && deposit.deposit_remaining > 3) {
      console.log(`   ⚠️  WARNING: Ultimate user has ${deposit.deposit_remaining} Pilates lessons`);
      console.log(`   ℹ️  Should have max 3 lessons per week`);
    } else if (packageName === 'Ultimate Medium' && deposit.deposit_remaining > 1) {
      console.log(`   ⚠️  WARNING: Ultimate Medium user has ${deposit.deposit_remaining} Pilates lessons`);
      console.log(`   ℹ️  Should have max 1 lesson per week`);
    } else {
      console.log(`   ✅ Amount looks correct`);
    }
    console.log('');
  });

  // Summary
  console.log('═'.repeat(60));
  console.log('\n📊 SUMMARY:\n');

  const ultimate = ultimateUsers.filter(d => d.package?.name === 'Ultimate');
  const ultimateMedium = ultimateUsers.filter(d => d.package?.name === 'Ultimate Medium');

  console.log(`Ultimate users: ${ultimate.length}`);
  const ultimateErrors = ultimate.filter(d => d.deposit_remaining > 3);
  if (ultimateErrors.length > 0) {
    console.log(`   ⚠️  ${ultimateErrors.length} have > 3 lessons!`);
    ultimateErrors.forEach(d => {
      console.log(`      - ${d.user?.first_name} ${d.user?.last_name}: ${d.deposit_remaining} lessons`);
    });
  } else {
    console.log(`   ✅ All have ≤ 3 lessons`);
  }

  console.log(`\nUltimate Medium users: ${ultimateMedium.length}`);
  const mediumErrors = ultimateMedium.filter(d => d.deposit_remaining > 1);
  if (mediumErrors.length > 0) {
    console.log(`   ⚠️  ${mediumErrors.length} have > 1 lesson!`);
    mediumErrors.forEach(d => {
      console.log(`      - ${d.user?.first_name} ${d.user?.last_name}: ${d.deposit_remaining} lessons`);
    });
  } else {
    console.log(`   ✅ All have ≤ 1 lesson`);
  }

  console.log('');
}

checkUltimatePilates().catch(console.error);

