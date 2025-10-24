// Check for cancelled bookings
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkCancelled() {
  console.log('\n🔍 Checking cancelled bookings...\n');

  const userId = '017fea7a-8642-4767-8a6d-1702608d5b51';
  const slotId = 'ad5d9437-8ddc-4419-9ea8-110f087a9ed5';

  // Check ALL bookings (including cancelled)
  const { data: allBookings } = await supabase
    .from('pilates_bookings')
    .select('*')
    .eq('user_id', userId)
    .eq('slot_id', slotId)
    .order('created_at', { ascending: false });

  console.log(`📋 All bookings for user+slot: ${allBookings?.length || 0}`);
  if (allBookings && allBookings.length > 0) {
    allBookings.forEach(b => {
      console.log(`   - Status: ${b.status}, ID: ${b.id}`);
    });
  }

  // Check if there's a cancelled booking
  const { data: cancelled } = await supabase
    .from('pilates_bookings')
    .select('*')
    .eq('user_id', userId)
    .eq('slot_id', slotId)
    .eq('status', 'cancelled');

  console.log(`\n🚫 Cancelled bookings: ${cancelled?.length || 0}`);
  
  if (cancelled && cancelled.length > 0) {
    console.log('\n⚠️  THIS IS THE PROBLEM!');
    console.log('⚠️  Cancelled booking exists → ON CONFLICT triggers → DO NOTHING → returns null');
  }
}

checkCancelled().catch(console.error);

