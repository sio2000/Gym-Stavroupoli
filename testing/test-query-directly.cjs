// Test the query directly via Node.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testQuery() {
  console.log('\n🔍 Testing query directly...\n');

  const { data, error } = await supabase
    .from('pilates_bookings')
    .select(`
      booking_date,
      status,
      created_at,
      user:user_profiles(first_name, last_name, email),
      slot:pilates_schedule_slots(date, start_time, end_time, max_capacity)
    `)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`📊 Found ${data?.length || 0} bookings\n`);

  if (data && data.length > 0) {
    console.log('📋 Results:\n');
    data.forEach((booking, i) => {
      console.log(`${i + 1}. ${booking.user?.first_name} ${booking.user?.last_name}`);
      console.log(`   Email: ${booking.user?.email}`);
      console.log(`   Booking: ${booking.booking_date}`);
      console.log(`   Class: ${booking.slot?.date} ${booking.slot?.start_time}`);
      console.log(`   Status: ${booking.status}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No bookings found');
  }
}

testQuery().catch(console.error);

