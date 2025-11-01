// Check deposits before tests to restore them
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkBeforeTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ΕΛΕΓΧΟΣ DEPOSITS ΠΡΙΝ ΑΠΟ 7 ΩΡΕΣ (πριν τα tests)        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Get deposits created before 7 hours ago
  const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000);
  
  const { data: oldDeposits } = await supabase
    .from('pilates_deposits')
    .select('*')
    .lt('created_at', sevenHoursAgo.toISOString())
    .order('created_at', { ascending: false });

  console.log(`📊 Deposits created before 7 hours ago: ${oldDeposits?.length || 0}\n`);

  if (oldDeposits && oldDeposits.length > 0) {
    console.log('📋 These are the ORIGINAL deposits (before tests):\n');
    
    oldDeposits.forEach((d, i) => {
      console.log(`${i + 1}. User: ${d.user_id}`);
      console.log(`   Created: ${d.created_at}`);
      console.log(`   Current remaining: ${d.deposit_remaining}`);
      console.log(`   Is active: ${d.is_active}`);
      console.log('');
    });
  }

  // Get current deposits
  const { data: currentDeposits } = await supabase
    .from('pilates_deposits')
    .select('*')
    .eq('is_active', true);

  console.log(`\n📊 Current active deposits: ${currentDeposits?.length || 0}\n`);

  // Compare
  console.log('═'.repeat(60));
  console.log('\n📊 COMPARISON:\n');
  
  if (oldDeposits && currentDeposits) {
    const oldByUser = {};
    oldDeposits.forEach(d => {
      oldByUser[d.user_id] = d.deposit_remaining;
    });

    const changed = [];
    currentDeposits.forEach(d => {
      const oldAmount = oldByUser[d.user_id];
      if (oldAmount !== undefined && oldAmount !== d.deposit_remaining) {
        changed.push({
          userId: d.user_id,
          old: oldAmount,
          current: d.deposit_remaining,
          difference: d.deposit_remaining - oldAmount
        });
      }
    });

    if (changed.length > 0) {
      console.log(`⚠️  ${changed.length} deposits changed:\n`);
      changed.forEach(c => {
        console.log(`   User: ${c.userId}`);
        console.log(`   Was: ${c.old} → Now: ${c.current} (diff: ${c.difference > 0 ? '+' : ''}${c.difference})`);
        console.log('');
      });
    } else {
      console.log('✅ No changes detected');
    }
  }

  console.log('\n═'.repeat(60));
  console.log('\n📊 Summary:\n');
  console.log('These are the deposits that existed before the tests.');
  console.log('You can use this information to restore the correct amounts.\n');
}

checkBeforeTests().catch(console.error);






