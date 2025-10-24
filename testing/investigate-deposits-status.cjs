// Deep investigation of pilates deposits
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function investigateDeposits() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  DEEP INVESTIGATION - PILATES DEPOSITS                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Check all deposits
  const { data: allDeposits, error: depositsError } = await supabase
    .from('pilates_deposits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (depositsError) {
    console.log('❌ Error fetching deposits:', depositsError.message);
    return;
  }

  console.log(`📊 Total deposits in DB: ${allDeposits?.length || 0}\n`);

  // Categorize deposits
  const active = allDeposits?.filter(d => d.is_active && d.deposit_remaining > 0) || [];
  const inactive = allDeposits?.filter(d => !d.is_active || d.deposit_remaining <= 0) || [];
  const expired = allDeposits?.filter(d => d.expires_at && new Date(d.expires_at) < new Date()) || [];

  console.log(`✅ Active deposits (is_active=true, deposit_remaining>0): ${active.length}`);
  console.log(`❌ Inactive deposits: ${inactive.length}`);
  console.log(`⏰ Expired deposits: ${expired.length}\n`);

  // Show sample active deposits
  if (active.length > 0) {
    console.log('📋 Sample Active Deposits:');
    active.slice(0, 10).forEach((d, i) => {
      console.log(`   ${i + 1}. User: ${d.user_id} - Remaining: ${d.deposit_remaining} - Created: ${d.created_at}`);
    });
    console.log('');
  }

  // Check users
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name')
    .limit(50);

  console.log(`📊 Total users in user_profiles: ${users?.length || 0}\n`);

  // Check which users have deposits
  if (users && active.length > 0) {
    const userIdsWithDeposits = new Set(active.map(d => d.user_id));
    const usersWithDeposits = users.filter(u => userIdsWithDeposits.has(u.id));
    const usersWithoutDeposits = users.filter(u => !userIdsWithDeposits.has(u.id));

    console.log(`✅ Users WITH active deposits: ${usersWithDeposits.length}`);
    console.log(`❌ Users WITHOUT active deposits: ${usersWithoutDeposits.length}\n`);

    if (usersWithDeposits.length > 0) {
      console.log('📋 Users WITH deposits:');
      usersWithDeposits.slice(0, 10).forEach((u, i) => {
        const deposit = active.find(d => d.user_id === u.id);
        console.log(`   ${i + 1}. ${u.first_name} ${u.last_name} - ${deposit?.deposit_remaining} classes`);
      });
      console.log('');
    }

    if (usersWithoutDeposits.length > 0) {
      console.log('📋 Users WITHOUT deposits:');
      usersWithoutDeposits.slice(0, 10).forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.first_name} ${u.last_name}`);
      });
      console.log('');
    }
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('\n📊 SUMMARY:');
  console.log(`   Total deposits in DB: ${allDeposits?.length || 0}`);
  console.log(`   Active deposits: ${active.length}`);
  console.log(`   Users available: ${users?.length || 0}`);
  console.log(`   Users with deposits: ${active.length > 0 ? new Set(active.map(d => d.user_id)).size : 0}`);
  console.log('\n');
}

investigateDeposits().catch(console.error);

