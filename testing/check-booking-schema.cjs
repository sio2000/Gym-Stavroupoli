// Check pilates_bookings schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkSchema() {
  console.log('\n🔍 Checking pilates_bookings schema...\n');

  // Check for unique constraint
  const { data, error } = await supabase.rpc('pg_get_constraintdef', {
    constraint_name: 'pilates_bookings_user_id_slot_id_key'
  });

  console.log('Unique constraint:', data || 'NOT FOUND');
  console.log('Error:', error);

  // Check table columns
  const { data: bookings } = await supabase
    .from('pilates_bookings')
    .select('*')
    .limit(5);

  console.log('\n📋 Sample bookings:');
  console.log(JSON.stringify(bookings, null, 2));
}

checkSchema().catch(console.error);

