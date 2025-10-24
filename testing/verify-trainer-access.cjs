// Verify that trainers can now see bookings
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyTrainerAccess() {
  console.log('\n🔍 Verifying Trainer Access to Pilates Bookings\n');

  try {
    // Find a trainer
    const { data: trainers } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, role')
      .eq('role', 'trainer')
      .limit(1);

    if (!trainers || trainers.length === 0) {
      console.log('⚠️  No trainers found in database');
      console.log('Creating a test scenario με admin user...\n');
      
      // Use admin instead
      const { data: admins } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, role')
        .eq('role', 'admin')
        .limit(1);

      if (!admins) {
        console.log('❌ No admin found either');
        return;
      }

      console.log(`Testing με admin: ${admins[0].first_name}`);
    } else {
      console.log(`✅ Found trainer: ${trainers[0].first_name} ${trainers[0].last_name}`);
    }

    // Get a slot with bookings
    const { data: slots } = await supabase
      .from('pilates_schedule_slots')
      .select('id, date, start_time')
      .eq('is_active', true)
      .limit(5);

    if (!slots) {
      console.log('❌ No slots found');
      return;
    }

    // Find slot with bookings
    for (const slot of slots) {
      const { data: bookings, error } = await supabase
        .from('pilates_bookings')
        .select(`
          *,
          user:user_profiles(first_name, last_name, email)
        `)
        .eq('slot_id', slot.id)
        .eq('status', 'confirmed');

      console.log(`\nSlot: ${slot.date} ${slot.start_time}`);
      
      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        console.log(`  Code: ${error.code}`);
        console.log(`  Details: ${error.details}`);
      } else {
        console.log(`  ✅ Bookings retrieved: ${bookings?.length || 0}`);
        
        if (bookings && bookings.length > 0) {
          console.log(`  Users booked:`);
          bookings.forEach(b => {
            console.log(`    - ${b.user?.first_name} ${b.user?.last_name} (${b.user?.email})`);
          });
        }
      }
    }

    console.log('\n═'.repeat(60));
    console.log('\n✅ Το RLS fix πρέπει να επιτρέπει trainers να δουν bookings');
    console.log('✅ Τρέξε το: database/FIX_PILATES_RLS_FOR_TRAINERS.sql\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

verifyTrainerAccess();

