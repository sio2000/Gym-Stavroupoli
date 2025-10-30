// Show last 30 users who made bookings with WHEN they made the booking
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function showLast30Bookings() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ΤΕΛΕΥΤΑΙΟΙ 30 ΧΡΗΣΤΕΣ ΠΟΥ ΚΑΝΑΝΕ ΚΡΑΤΗΣΗ                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const { data, error } = await supabase
    .from('pilates_bookings')
    .select(`
      created_at,
      booking_date,
      status,
      user:user_profiles(first_name, last_name, email),
      slot:pilates_schedule_slots(date, start_time)
    `)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`📊 Βρέθηκαν ${data?.length || 0} κρατήσεις\n`);

  if (data && data.length > 0) {
    data.forEach((booking, i) => {
      const bookingDate = new Date(booking.created_at);
      const dateStr = bookingDate.toLocaleDateString('el-GR');
      const timeStr = bookingDate.toLocaleTimeString('el-GR');
      
      console.log(`${i + 1}. ${booking.user?.first_name} ${booking.user?.last_name}`);
      console.log(`   Email: ${booking.user?.email}`);
      console.log(`   Κράτηση έγινε: ${dateStr} στις ${timeStr}`);
      console.log(`   Μαθημα για: ${booking.slot?.date} ${booking.slot?.start_time}`);
      console.log('');
    });
  } else {
    console.log('⚠️  Δεν βρέθηκαν κρατήσεις');
  }
}

showLast30Bookings().catch(console.error);

