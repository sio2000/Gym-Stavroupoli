// Check if bookings exist
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkBookings() {
  console.log('\n🔍 Checking bookings...\n');

  // Check all bookings
  const { data: allBookings } = await supabase
    .from('pilates_bookings')
    .select('id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log(`📊 Total bookings found: ${allBookings?.length || 0}`);
  
  if (allBookings && allBookings.length > 0) {
    console.log('\n📋 Last 10 bookings:');
    allBookings.forEach((b, i) => {
      console.log(`   ${i + 1}. Status: ${b.status}, Created: ${b.created_at}`);
    });
  }

  // Check confirmed bookings
  const { data: confirmed } = await supabase
    .from('pilates_bookings')
    .select('id, status')
    .eq('status', 'confirmed')
    .limit(10);

  console.log(`\n✅ Confirmed bookings: ${confirmed?.length || 0}`);

  // Check if RLS is blocking
  const { data: rlsTest, error: rlsError } = await supabase
    .from('pilates_bookings')
    .select('*')
    .limit(1);

  if (rlsError) {
    console.log(`\n⚠️  RLS Error: ${rlsError.message}`);
  }
}

checkBookings().catch(console.error);

