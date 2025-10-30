// Check pilates_deposits table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkTable() {
  console.log('\n🔍 Checking pilates_deposits table...\n');

  // Get ALL deposits (not just active)
  const { data: allDeposits } = await supabase
    .from('pilates_deposits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!allDeposits || allDeposits.length === 0) {
    console.log('❌ Table is empty');
    return;
  }

  console.log(`📊 Found ${allDeposits.length} deposits (all statuses)\n`);

  // Group by is_active
  const active = allDeposits.filter(d => d.is_active);
  const inactive = allDeposits.filter(d => !d.is_active);

  console.log(`✅ Active: ${active.length}`);
  console.log(`❌ Inactive: ${inactive.length}\n`);

  if (active.length > 0) {
    console.log('📋 Active deposits:\n');
    active.forEach((d, i) => {
      console.log(`${i + 1}. User: ${d.user_id}`);
      console.log(`   Remaining: ${d.deposit_remaining}`);
      console.log(`   Created: ${d.created_at}`);
      console.log('');
    });
  }

  // Check for high amounts
  const highAmounts = allDeposits.filter(d => d.deposit_remaining > 20);
  if (highAmounts.length > 0) {
    console.log(`\n⚠️  WARNING: ${highAmounts.length} deposits with > 20 lessons:\n`);
    highAmounts.forEach(d => {
      console.log(`   User: ${d.user_id} - ${d.deposit_remaining} lessons`);
    });
  }
}

checkTable().catch(console.error);

