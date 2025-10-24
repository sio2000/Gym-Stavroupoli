// Check RLS status for Pilates tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkRLS() {
  console.log('\n🔍 Checking RLS Status for Pilates Tables\n');

  try {
    // Check via information_schema
    const tables = ['pilates_bookings', 'pilates_schedule_slots', 'pilates_deposits'];

    for (const table of tables) {
      console.log(`Table: ${table}`);
      
      // Try to query the table to see if RLS affects queries
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`  ⚠️  Error: ${error.message}`);
      } else {
        console.log(`  ✅ Accessible (found ${data?.length || 0} rows)`);
      }
    }

    console.log('\n═'.repeat(60));
    console.log('\n🔧 RECOMMENDATION:\n');
    console.log('Το RLS πρέπει να είναι ENABLED για security.');
    console.log('Τρέξε το SQL από: database/ENABLE_PILATES_RLS_CRITICAL.sql\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRLS();

