// Cleanup cancelled bookings for fresh tests
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function cleanupCancelled() {
  console.log('\n🧹 Cleaning up cancelled bookings...\n');

  // Delete all cancelled bookings
  const { data, error } = await supabase
    .from('pilates_bookings')
    .delete()
    .eq('status', 'cancelled');

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Deleted cancelled bookings`);

  // Reset deposits to 10 for all users
  const { data: deposits } = await supabase
    .from('pilates_deposits')
    .select('id')
    .eq('is_active', true);

  if (deposits && deposits.length > 0) {
    for (const deposit of deposits) {
      await supabase
        .from('pilates_deposits')
        .update({ deposit_remaining: 10 })
        .eq('id', deposit.id);
    }
    console.log(`✅ Reset ${deposits.length} deposits to 10 classes`);
  }

  console.log('\n🎊 Cleanup complete! Ready for fresh tests!\n');
}

cleanupCancelled().catch(console.error);

