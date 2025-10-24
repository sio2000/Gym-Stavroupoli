// Debug why RPC returns null booking_id
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function debugRPC() {
  console.log('\n🔍 Debugging RPC null booking_id issue...\n');

  const userId = '017fea7a-8642-4767-8a6d-1702608d5b51'; // Φιλιππος
  const slotId = 'ad5d9437-8ddc-4419-9ea8-110f087a9ed5';

  // Check existing bookings
  const { data: existing } = await supabase
    .from('pilates_bookings')
    .select('*')
    .eq('user_id', userId)
    .eq('slot_id', slotId)
    .eq('status', 'confirmed');

  console.log(`📋 Existing bookings for this user+slot: ${existing?.length || 0}`);
  if (existing && existing.length > 0) {
    existing.forEach(b => {
      console.log(`   - ID: ${b.id}, Status: ${b.status}, Created: ${b.created_at}`);
    });
  }

  // Try RPC
  console.log('\n🎯 Calling RPC...');
  const { data, error } = await supabase
    .rpc('book_pilates_class', { p_user_id: userId, p_slot_id: slotId });

  console.log('\n📊 RPC Response:');
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Error:', error);

  // Check bookings after RPC
  const { data: bookingsAfter } = await supabase
    .from('pilates_bookings')
    .select('*')
    .eq('user_id', userId)
    .eq('slot_id', slotId)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`\n📋 Bookings after RPC: ${bookingsAfter?.length || 0}`);
}

debugRPC().catch(console.error);

