// Check Ultimate and Ultimate Medium users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkUltimateUsers() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ΕΛΕΓΧΟΣ ULTIMATE & ULTIMATE MEDIUM USERS                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Get Ultimate package IDs
  const { data: ultimatePackages } = await supabase
    .from('pilates_packages')
    .select('id, name')
    .in('name', ['Ultimate', 'Ultimate Medium']);

  if (!ultimatePackages || ultimatePackages.length === 0) {
    console.log('❌ No Ultimate packages found');
    return;
  }

  console.log('📦 Found packages:');
  ultimatePackages.forEach(p => {
    console.log(`   - ${p.name} (ID: ${p.id})`);
  });

  const packageIds = ultimatePackages.map(p => p.id);

  // Get users with these packages
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
    .in('package_id', packageIds)
    .eq('is_active', true);

  if (!deposits || deposits.length === 0) {
    console.log('\n❌ No active deposits found for Ultimate users');
    return;
  }

  console.log(`\n📊 Found ${deposits.length} active Ultimate deposits\n`);

  // Check each user
  deposits.forEach((deposit, i) => {
    console.log(`${i + 1}. ${deposit.user?.first_name} ${deposit.user?.last_name}`);
    console.log(`   Email: ${deposit.user?.email}`);
    console.log(`   Package: ${deposit.package?.name}`);
    console.log(`   Deposit Remaining: ${deposit.deposit_remaining}`);
    console.log(`   Credited: ${deposit.credited_at}`);
    console.log(`   Expires: ${deposit.expires_at}`);

    // Check if deposit_remaining is too high
    const packageName = deposit.package?.name;
    if (packageName === 'Ultimate' && deposit.deposit_remaining > 3) {
      console.log(`   ⚠️  WARNING: Ultimate user has ${deposit.deposit_remaining} lessons (should be max 3)`);
    } else if (packageName === 'Ultimate Medium' && deposit.deposit_remaining > 1) {
      console.log(`   ⚠️  WARNING: Ultimate Medium user has ${deposit.deposit_remaining} lessons (should be max 1)`);
    } else {
      console.log(`   ✅ Correct amount`);
    }
    console.log('');
  });

  // Summary
  console.log('═'.repeat(60));
  console.log('\n📊 SUMMARY:\n');

  const ultimate = deposits.filter(d => d.package?.name === 'Ultimate');
  const ultimateMedium = deposits.filter(d => d.package?.name === 'Ultimate Medium');

  console.log(`Ultimate users: ${ultimate.length}`);
  const ultimateErrors = ultimate.filter(d => d.deposit_remaining > 3);
  if (ultimateErrors.length > 0) {
    console.log(`   ⚠️  ${ultimateErrors.length} have too many lessons!`);
  } else {
    console.log(`   ✅ All have correct amounts`);
  }

  console.log(`\nUltimate Medium users: ${ultimateMedium.length}`);
  const mediumErrors = ultimateMedium.filter(d => d.deposit_remaining > 1);
  if (mediumErrors.length > 0) {
    console.log(`   ⚠️  ${mediumErrors.length} have too many lessons!`);
  } else {
    console.log(`   ✅ All have correct amounts`);
  }

  console.log('');
}

checkUltimateUsers().catch(console.error);

