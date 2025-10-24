// Cleanup ALL bookings for completely fresh tests
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function cleanupAll() {
  console.log('\n🧹 Cleaning up ALL bookings...\n');

  // Delete ALL bookings
  const { error } = await supabase
    .from('pilates_bookings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Deleted all bookings`);

  // Reset all deposits to 20 for fresh tests
  const { data: deposits } = await supabase
    .from('pilates_deposits')
    .select('id')
    .eq('is_active', true);

  if (deposits && deposits.length > 0) {
    for (const deposit of deposits) {
      await supabase
        .from('pilates_deposits')
        .update({ deposit_remaining: 20 })
        .eq('id', deposit.id);
    }
    console.log(`✅ Reset ${deposits.length} deposits to 20 classes`);
  }

  console.log('\n🎊 Complete cleanup done! Ready for fresh tests!\n');
}

cleanupAll().catch(console.error);

