// Analyze bookings from 23/10 to find test bookings
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function analyzeTestBookings() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ΑΝΑΛΥΣΗ TEST BOOKINGS - 23/10                             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Get all bookings from 23/10
  const startDate = '2025-10-23T00:00:00Z';
  const endDate = '2025-10-24T08:00:00Z';

  const { data: bookings, error } = await supabase
    .from('pilates_bookings')
    .select(`
      id,
      user_id,
      slot_id,
      status,
      created_at,
      user:user_profiles(first_name, last_name, email),
      slot:pilates_schedule_slots(date, start_time)
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`📊 Total bookings από 23/10: ${bookings?.length || 0}\n`);

  // Group by user
  const userStats = {};
  
  bookings?.forEach(booking => {
    const userId = booking.user_id;
    if (!userStats[userId]) {
      userStats[userId] = {
        name: `${booking.user?.first_name} ${booking.user?.last_name}`,
        email: booking.user?.email,
        bookings: [],
        totalBookings: 0
      };
    }
    userStats[userId].bookings.push({
      id: booking.id,
      created_at: booking.created_at,
      slot_date: booking.slot?.date,
      slot_time: booking.slot?.start_time,
      status: booking.status
    });
    userStats[userId].totalBookings++;
  });

  // Show summary
  console.log('📋 ΚΡΑΤΗΣΕΙΣ ΑΝΑ ΧΡΗΣΤΗ:\n');
  
  Object.values(userStats).forEach((user, i) => {
    console.log(`${i + 1}. ${user.name} (${user.email})`);
    console.log(`   Συνολικές κρατήσεις: ${user.totalBookings}`);
    console.log(`   Δημιουργήθηκαν:`);
    user.bookings.forEach(b => {
      const date = new Date(b.created_at);
      console.log(`      - ${date.toLocaleString('el-GR')} (ID: ${b.id})`);
    });
    console.log('');
  });

  // Check deposits affected
  console.log('═'.repeat(60));
  console.log('\n💰 ΕΞΕΤΑΣΗ DEPOSITS...\n');

  for (const userId in userStats) {
    const { data: deposit } = await supabase
      .from('pilates_deposits')
      .select('deposit_remaining, id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (deposit) {
      console.log(`${userStats[userId].name}:`);
      console.log(`   Τρέχον deposit: ${deposit.deposit_remaining}`);
      console.log(`   Κρατήσεις από tests: ${userStats[userId].totalBookings}`);
      console.log(`   Θα πρέπει να έχει: ${deposit.deposit_remaining + userStats[userId].totalBookings}`);
      console.log('');
    }
  }

  return { bookings, userStats };
}

analyzeTestBookings().catch(console.error);

