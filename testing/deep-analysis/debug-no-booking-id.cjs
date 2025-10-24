// Debug why some RPCs return no booking ID
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function debug() {
  console.log('\n🔍 Debug: Why No Booking ID?\n');

  // Get a user
  const { data: deposits } = await supabase
    .from('pilates_deposits')
    .select('user_id, deposit_remaining')
    .eq('is_active', true)
    .gt('deposit_remaining', 0)
    .limit(10);

  const today = new Date().toISOString().split('T')[0];
  const { data: slots } = await supabase
    .from('pilates_schedule_slots')
    .select('id')
    .gte('date', today)
    .eq('is_active', true)
    .limit(1);

  if (!deposits || !slots) {
    console.log('No test data');
    return;
  }

  // Try multiple users
  for (let i = 0; i < Math.min(5, deposits.length); i++) {
    const user = deposits[i];
    const slot = slots[0];

    console.log(`\nTest ${i + 1}:`);
    console.log(`  User: ${user.user_id.substring(0, 8)}...`);
    console.log(`  Deposit: ${user.deposit_remaining}`);

    // Check existing
    const { data: existing } = await supabase
      .from('pilates_bookings')
      .select('id')
      .eq('user_id', user.user_id)
      .eq('slot_id', slot.id)
      .eq('status', 'confirmed')
      .single();

    if (existing) {
      console.log(`  ⏭️  Already booked`);
      continue;
    }

    // Call RPC
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('book_pilates_class', {
        p_user_id: user.user_id,
        p_slot_id: slot.id
      });

    console.log(`  RPC Response:`, JSON.stringify(rpcData));

    if (rpcError) {
      console.log(`  ❌ Error: ${rpcError.message}`);
      continue;
    }

    if (!rpcData) {
      console.log(`  ❌ rpcData is null/undefined!`);
      continue;
    }

    if (Array.isArray(rpcData)) {
      console.log(`  ✅ Is Array, length: ${rpcData.length}`);
      if (rpcData.length > 0) {
        console.log(`  ✅ First element:`, rpcData[0]);
        console.log(`  ✅ booking_id:`, rpcData[0]?.booking_id);
      } else {
        console.log(`  ❌ Empty array!`);
      }
    }

    const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;
    console.log(`  Final bookingId: ${bookingId}`);

    // Cleanup
    if (bookingId) {
      await supabase.rpc('cancel_pilates_booking', {
        p_booking_id: bookingId,
        p_user_id: user.user_id
      });
      console.log(`  ✅ Cleaned up`);
    }
  }

  console.log('');
}

debug();

