// Check Ultimate users directly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkUltimateDirect() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ΕΛΕΓΧΟΣ ULTIMATE USERS - DIRECT                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Get all deposits first
  const { data: allDeposits } = await supabase
    .from('pilates_deposits')
    .select('*')
    .eq('is_active', true);

  console.log(`📊 Total active deposits: ${allDeposits?.length || 0}\n`);

  if (!allDeposits || allDeposits.length === 0) {
    console.log('❌ No deposits found');
    return;
  }

  // Get packages
  const packageIds = [...new Set(allDeposits.map(d => d.package_id).filter(Boolean))];
  
  const { data: packages } = await supabase
    .from('pilates_packages')
    .select('id, name')
    .in('id', packageIds);

  console.log(`📦 Found ${packages?.length || 0} packages\n`);

  if (packages && packages.length > 0) {
    packages.forEach(p => {
      console.log(`   - ${p.name} (ID: ${p.id})`);
    });
  }

  // Get user profiles
  const userIds = [...new Set(allDeposits.map(d => d.user_id))];
  
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, email')
    .in('id', userIds);

  console.log(`\n👥 Found ${users?.length || 0} users\n`);

  // Combine the data
  const enriched = allDeposits.map(deposit => {
    const user = users?.find(u => u.id === deposit.user_id);
    const pkg = packages?.find(p => p.id === deposit.package_id);
    
    return {
      ...deposit,
      userName: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
      userEmail: user?.email,
      packageName: pkg?.name || 'N/A'
    };
  });

  // Filter Ultimate users
  const ultimateUsers = enriched.filter(d => 
    d.packageName === 'Ultimate' || d.packageName === 'Ultimate Medium'
  );

  console.log(`📊 Ultimate/Ultimate Medium users: ${ultimateUsers.length}\n`);

  if (ultimateUsers.length > 0) {
    ultimateUsers.forEach((d, i) => {
      console.log(`${i + 1}. ${d.userName}`);
      console.log(`   Email: ${d.userEmail}`);
      console.log(`   Package: ${d.packageName}`);
      console.log(`   Deposit: ${d.deposit_remaining} μαθήματα`);
      
      if (d.packageName === 'Ultimate' && d.deposit_remaining > 3) {
        console.log(`   ⚠️  WARNING: Should have max 3, has ${d.deposit_remaining}`);
      } else if (d.packageName === 'Ultimate Medium' && d.deposit_remaining > 1) {
        console.log(`   ⚠️  WARNING: Should have max 1, has ${d.deposit_remaining}`);
      } else {
        console.log(`   ✅ OK`);
      }
      console.log('');
    });
  } else {
    console.log('✅ No Ultimate users found');
  }
}

checkUltimateDirect().catch(console.error);

