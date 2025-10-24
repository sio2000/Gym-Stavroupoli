// Check existing bookings for problematic users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkExisting() {
  console.log('\n🔍 Checking Existing Bookings\n');

  const problematicUsers = [
    '5939b88d-65b1-4951-950f-7591895c1df7',
    'bcb09526-5d12-49cb-ad54-cdcb340150d4',
    '017fea7a-8642-4767-8a6d-1702608d5b51',
    '6f1588ba-7feb-4966-8ae8-ca4ae5deacdb'
  ];

  const today = new Date().toISOString().split('T')[0];
  const { data: slots } = await supabase
    .from('pilates_schedule_slots')
    .select('id')
    .gte('date', today)
    .eq('is_active', true)
    .limit(1);

  const slotId = slots?.[0]?.id;

  for (const userId of problematicUsers) {
    console.log(`User: ${userId.substring(0, 8)}...`);

    const { data: bookings } = await supabase
      .from('pilates_bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('slot_id', slotId);

    console.log(`  Bookings for slot: ${bookings?.length || 0}`);
    if (bookings && bookings.length > 0) {
      bookings.forEach(b => {
        console.log(`    - ID: ${b.id}, Status: ${b.status}`);
      });
    }
    console.log('');
  }

  console.log('═'.repeat(60));
  console.log('\n🔧 ΛΥΣΗ: Κάνε full cleanup πριν το test:\n');
  console.log('const { data: allBookings } = await supabase');
  console.log('  .from("pilates_bookings")');
  console.log('  .select("id, user_id")');
  console.log('  .eq("status", "confirmed");');
  console.log('\n// Cancel all');
  console.log('for (const booking of allBookings) {');
  console.log('  await supabase.rpc("cancel_pilates_booking", {');
  console.log('    p_booking_id: booking.id,');
  console.log('    p_user_id: booking.user_id');
  console.log('  });');
  console.log('}\n');
}

checkExisting();

