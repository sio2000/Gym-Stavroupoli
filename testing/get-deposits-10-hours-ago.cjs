// Get exactly what deposits were 10 hours ago
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getDeposits10HoursAgo() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  DEPOSITS ΠΡΙΝ ΑΠΟ 10 ΩΡΕΣ                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Get deposits that existed 10 hours ago
  const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
  
  const { data: oldDeposits } = await supabase
    .from('pilates_deposits')
    .select('*')
    .lt('created_at', tenHoursAgo.toISOString())
    .order('created_at', { ascending: false });

  console.log(`📊 Deposits created before 10 hours ago: ${oldDeposits?.length || 0}\n`);

  if (!oldDeposits || oldDeposits.length === 0) {
    console.log('❌ No deposits found');
    return;
  }

  // Get user profiles
  const userIds = [...new Set(oldDeposits.map(d => d.user_id))];
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name')
    .in('id', userIds);

  const userMap = {};
  users?.forEach(u => {
    userMap[u.id] = `${u.first_name} ${u.last_name}`;
  });

  // Get packages
  const packageIds = [...new Set(oldDeposits.map(d => d.package_id).filter(Boolean))];
  const { data: packages } = await supabase
    .from('membership_packages')
    .select('id, name')
    .in('id', packageIds);

  const packageMap = {};
  packages?.forEach(p => {
    packageMap[p.id] = p.name;
  });

  // Show deposits
  console.log('📋 Deposits πριν από 10 ώρες:\n');
  
  const sqlUpdates = [];
  
  oldDeposits.forEach((d, i) => {
    const userName = userMap[d.user_id] || d.user_id;
    const packageName = packageMap[d.package_id] || 'N/A';
    
    console.log(`${i + 1}. ${userName}`);
    console.log(`   Package: ${packageName}`);
    console.log(`   Had: ${d.deposit_remaining} μαθήματα`);
    console.log(`   User ID: ${d.user_id}`);
    console.log(`   Deposit ID: ${d.id}`);
    console.log('');

    // Create SQL update
    sqlUpdates.push({
      userId: d.user_id,
      depositId: d.id,
      amount: d.deposit_remaining,
      userName,
      packageName
    });
  });

  // Generate SQL
  console.log('═'.repeat(60));
  console.log('\n📝 GENERATED SQL:\n');
  
  sqlUpdates.forEach(u => {
    console.log(`UPDATE pilates_deposits`);
    console.log(`SET deposit_remaining = ${u.amount}, is_active = true`);
    console.log(`WHERE user_id = '${u.userId}' AND is_active = true;`);
    console.log(`-- ${u.userName} (${u.packageName})`);
    console.log('');
  });

  return sqlUpdates;
}

getDeposits10HoursAgo().catch(console.error);






