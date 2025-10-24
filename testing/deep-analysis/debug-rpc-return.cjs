// Debug RPC return value
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function debugRPC() {
  console.log('\n🔍 DEBUG: RPC Return Value Analysis\n');

  try {
    // Get test data
    const { data: deposits } = await supabase
      .from('pilates_deposits')
      .select('user_id, deposit_remaining')
      .eq('is_active', true)
      .gt('deposit_remaining', 0)
      .limit(1);

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

    const userId = deposits[0].user_id;
    const slotId = slots[0].id;

    // Check if already booked
    const { data: existing } = await supabase
      .from('pilates_bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('slot_id', slotId)
      .eq('status', 'confirmed')
      .single();

    if (existing) {
      console.log('Already booked, skipping...');
      return;
    }

    console.log(`User ID: ${userId}`);
    console.log(`Slot ID: ${slotId}\n`);

    // Call RPC
    console.log('Calling book_pilates_class RPC...\n');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('book_pilates_class', {
        p_user_id: userId,
        p_slot_id: slotId
      });

    console.log('═'.repeat(60));
    console.log('RPC RESPONSE ANALYSIS:');
    console.log('═'.repeat(60));
    
    if (rpcError) {
      console.log('\n❌ RPC ERROR:');
      console.log('  Message:', rpcError.message);
      console.log('  Code:', rpcError.code);
      console.log('  Details:', rpcError.details);
      console.log('  Hint:', rpcError.hint);
      return;
    }

    console.log('\n✅ RPC SUCCESS\n');
    console.log('Raw rpcData:');
    console.log(JSON.stringify(rpcData, null, 2));
    console.log('');
    console.log('Type:', typeof rpcData);
    console.log('Is Array:', Array.isArray(rpcData));
    console.log('Length:', Array.isArray(rpcData) ? rpcData.length : 'N/A');
    console.log('');

    if (Array.isArray(rpcData) && rpcData.length > 0) {
      console.log('First element:');
      console.log(JSON.stringify(rpcData[0], null, 2));
      console.log('');
      console.log('rpcData[0].booking_id:', rpcData[0]?.booking_id);
      console.log('rpcData[0].deposit_remaining:', rpcData[0]?.deposit_remaining);
    }

    console.log('\nFrontend code simulation:');
    const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;
    console.log('const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;');
    console.log('Result:', bookingId);
    console.log('Type:', typeof bookingId);

    if (!bookingId) {
      console.log('\n🚨 ΠΡΟΒΛΗΜΑ: bookingId is undefined/null!');
      console.log('Το RPC δεν επιστρέφει booking_id σωστά!');
    }

    // Check if booking was actually created
    console.log('\n═'.repeat(60));
    console.log('ΕΛΕΓΧΟΣ: Δημιουργήθηκε η κράτηση στη βάση;');
    console.log('═'.repeat(60));

    const { data: bookings, error: bookingsError } = await supabase
      .from('pilates_bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('slot_id', slotId)
      .eq('status', 'confirmed');

    if (bookingsError) {
      console.log('\n❌ Error:', bookingsError.message);
    } else if (!bookings || bookings.length === 0) {
      console.log('\n❌ ΟΧΙ! Καμία κράτηση δεν δημιουργήθηκε!');
      console.log('🚨 Το RPC έτρεξε αλλά ΔΕΝ δημιούργησε booking!');
    } else {
      console.log(`\n✅ ΝΑΙ! Βρέθηκαν ${bookings.length} booking(s):`);
      bookings.forEach(b => {
        console.log(`   ID: ${b.id}`);
        console.log(`   Created: ${b.created_at}`);
      });

      // Cleanup
      for (const booking of bookings) {
        await supabase.rpc('cancel_pilates_booking', {
          p_booking_id: booking.id,
          p_user_id: userId
        });
      }
      console.log('\n✅ Cleanup done');
    }

    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

debugRPC();

