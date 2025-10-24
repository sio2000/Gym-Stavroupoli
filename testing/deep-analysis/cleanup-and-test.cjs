// Cleanup all test bookings and rerun test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function cleanupAndTest() {
  console.log('\n🧹 Cleanup όλων των test bookings...\n');

  try {
    // Get today's slots
    const today = new Date().toISOString().split('T')[0];
    const { data: slots } = await supabase
      .from('pilates_schedule_slots')
      .select('id')
      .eq('date', today)
      .eq('is_active', true);

    if (slots) {
      for (const slot of slots) {
        // Cancel all bookings for today's slots
        const { data: bookings } = await supabase
          .from('pilates_bookings')
          .select('id, user_id')
          .eq('slot_id', slot.id)
          .eq('status', 'confirmed');

        if (bookings && bookings.length > 0) {
          console.log(`  Cleaning slot ${slot.id}: ${bookings.length} bookings`);
          
          for (const booking of bookings) {
            await supabase.rpc('cancel_pilates_booking', {
              p_booking_id: booking.id,
              p_user_id: booking.user_id
            });
          }
        }
      }
    }

    console.log('\n✅ Cleanup complete!\n');
    console.log('═'.repeat(60));
    console.log('Τώρα θα τρέξω το comprehensive test...\n');

    // Now run a fresh test
    const { exec } = require('child_process');
    exec('node test-exact-bug.cjs', (error, stdout, stderr) => {
      console.log(stdout);
      if (error) {
        console.error(stderr);
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

cleanupAndTest();

