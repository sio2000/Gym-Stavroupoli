// Double check deposits from 10 hours ago
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function doubleCheck() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  DOUBLE CHECK - DEPOSITS ΠΡΙΝ ΑΠΟ 10 ΩΡΕΣ                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
  
  const { data: oldDeposits } = await supabase
    .from('pilates_deposits')
    .select(`
      id,
      user_id,
      package_id,
      deposit_remaining,
      is_active,
      created_at,
      package:pilates_packages(name)
    `)
    .lt('created_at', tenHoursAgo.toISOString())
    .order('created_at', { ascending: false });

  // Get user names
  const userIds = [...new Set(oldDeposits?.map(d => d.user_id) || [])];
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name')
    .in('id', userIds);

  const userMap = {};
  users?.forEach(u => {
    userMap[u.id] = `${u.first_name} ${u.last_name}`;
  });

  console.log('📊 Grouping by amount πριν από 10 ώρες:\n');

  const byAmount = {};
  oldDeposits?.forEach(d => {
    const amount = d.deposit_remaining;
    if (!byAmount[amount]) {
      byAmount[amount] = [];
    }
    byAmount[amount].push({
      userId: d.user_id,
      userName: userMap[d.user_id] || d.user_id,
      packageName: d.package?.name || 'N/A',
      depositId: d.id
    });
  });

  Object.keys(byAmount).sort((a, b) => b - a).forEach(amount => {
    console.log(`${amount} μαθήματα: ${byAmount[amount].length} users`);
    byAmount[amount].forEach(u => {
      console.log(`   - ${u.userName} (${u.packageName})`);
    });
    console.log('');
  });

  // Check Ultimate users specifically
  console.log('═'.repeat(60));
  console.log('\n🎯 Ultimate & Ultimate Medium Users:\n');

  const ultimateUsers = oldDeposits?.filter(d => 
    d.package?.name === 'Ultimate' || d.package?.name === 'Ultimate Medium'
  ) || [];

  ultimateUsers.forEach(d => {
    const userName = userMap[d.user_id] || d.user_id;
    console.log(`${userName} (${d.package?.name})`);
    console.log(`   Had: ${d.deposit_remaining} μαθήματα`);
    
    if (d.package?.name === 'Ultimate' && d.deposit_remaining > 3) {
      console.log(`   ⚠️  ULTIMATE WITH TOO MANY LESSONS!`);
    } else if (d.package?.name === 'Ultimate Medium' && d.deposit_remaining > 1) {
      console.log(`   ⚠️  ULTIMATE MEDIUM WITH TOO MANY LESSONS!`);
    }
    console.log('');
  });
}

doubleCheck().catch(console.error);






