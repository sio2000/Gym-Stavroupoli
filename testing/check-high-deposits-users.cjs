// Check users with high deposits
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkHighDeposits() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ΕΛΕΓΧΟΣ ΧΡΗΣΤΩΝ ΜΕ ΥΨΗΛΑ DEPOSITS                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const highDepositUsers = [
    'ba262f03-6a57-4c63-9349-704d87bf8581', // 33
    '605db52c-fdf0-443d-88fb-c9df7dac3d0d', // 29
    '017fea7a-8642-4767-8a6d-1702608d5b51'  // 29
  ];

  for (const userId of highDepositUsers) {
    const { data: deposit } = await supabase
      .from('pilates_deposits')
      .select(`
        *,
        user:user_profiles(first_name, last_name, email),
        package:pilates_packages(name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (deposit) {
      console.log(`👤 ${deposit.user?.first_name} ${deposit.user?.last_name}`);
      console.log(`   Email: ${deposit.user?.email}`);
      console.log(`   Package: ${deposit.package?.name || 'N/A'} (ID: ${deposit.package_id})`);
      console.log(`   Deposit: ${deposit.deposit_remaining} μαθήματα`);
      console.log(`   Created: ${deposit.created_at}`);
      
      // Check if this is from our restoration
      if (deposit.created_at.includes('2025-10-24')) {
        console.log(`   ⚠️  CREATED TODAY - This is from our restoration!`);
        console.log(`   ℹ️  This user lost ${deposit.deposit_remaining} lessons from tests`);
      }
      
      // Check bookings to see how many they actually have
      const { data: bookings } = await supabase
        .from('pilates_bookings')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'confirmed');
      
      console.log(`   Current confirmed bookings: ${bookings?.length || 0}`);
      console.log('');
    }
  }

  console.log('═'.repeat(60));
  console.log('\n📊 SUMMARY:\n');
  console.log('Αυτοί οι χρήστες έχουν τα μαθήματα που επεστράφησαν από τα tests.');
  console.log('Τα υψηλά ποσά (29-33) είναι από την αποκατάσταση των deposits.\n');
}

checkHighDeposits().catch(console.error);

