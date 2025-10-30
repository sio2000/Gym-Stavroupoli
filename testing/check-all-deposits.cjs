// Check all deposits
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkAllDeposits() {
  console.log('\n🔍 Checking all pilates deposits...\n');

  const { data: deposits } = await supabase
    .from('pilates_deposits')
    .select(`
      id,
      user_id,
      package_id,
      deposit_remaining,
      is_active,
      credited_at,
      user:user_profiles(first_name, last_name, email)
    `)
    .eq('is_active', true)
    .order('deposit_remaining', { ascending: false })
    .limit(50);

  if (!deposits || deposits.length === 0) {
    console.log('❌ No active deposits found');
    return;
  }

  console.log(`📊 Found ${deposits.length} active deposits\n`);

  // Group by deposit_remaining
  const grouped = {};
  deposits.forEach(d => {
    const amount = d.deposit_remaining;
    if (!grouped[amount]) {
      grouped[amount] = [];
    }
    grouped[amount].push(d);
  });

  console.log('📋 Grouped by amount:\n');
  Object.keys(grouped).sort((a, b) => b - a).forEach(amount => {
    console.log(`${amount} μαθήματα: ${grouped[amount].length} users`);
    if (parseInt(amount) > 10) {
      console.log(`   ⚠️  WARNING: High amount!`);
      grouped[amount].slice(0, 3).forEach(d => {
        console.log(`      - ${d.user?.first_name} ${d.user?.last_name}`);
      });
    }
  });

  console.log('\n═'.repeat(60));
  console.log('\n📊 All deposits:\n');
  
  deposits.forEach((d, i) => {
    console.log(`${i + 1}. ${d.user?.first_name} ${d.user?.last_name}`);
    console.log(`   Deposit: ${d.deposit_remaining} μαθήματα`);
    console.log(`   Package ID: ${d.package_id || 'N/A'}`);
    console.log('');
  });
}

checkAllDeposits().catch(console.error);

