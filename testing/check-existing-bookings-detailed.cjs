// Check for existing bookings
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkExistingBookings() {
  console.log('\n🔍 Checking for existing bookings...\n');

  // Find a user with deposit
  const { data: deposits } = await supabase
    .from('pilates_deposits')
    .select('user_id, deposit_remaining')
    .eq('is_active', true)
    .gt('deposit_remaining', 0)
    .limit(5);

  if (!deposits || deposits.length === 0) {
    console.log('❌ No active deposits found');
    return;
  }

  console.log(`✅ Found ${deposits.length} users with deposits\n`);

  // Find an available slot
  const today = new Date();
  const { data: slot } = await supabase
    .from('pilates_schedule_slots')
    .select('id, date, start_time')
    .gte('date', today.toISOString().split('T')[0])
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!slot) {
    console.log('❌ No available slots');
    return;
  }

  console.log(`✅ Slot: ${slot.date} ${slot.start_time}\n`);

  // Check each user
  for (const deposit of deposits) {
    console.log(`\n👤 User: ${deposit.user_id}`);
    console.log(`   Deposit: ${deposit.deposit_remaining}`);

    // Check for existing booking
    const { data: existing } = await supabase
      .from('pilates_bookings')
      .select('*')
      .eq('user_id', deposit.user_id)
      .eq('slot_id', slot.id)
      .eq('status', 'confirmed');

    if (existing && existing.length > 0) {
      console.log(`   ⚠️  Already has booking for this slot!`);
      console.log(`   Booking ID: ${existing[0].id}`);
    } else {
      console.log(`   ✅ No existing booking - can try RPC`);
      
      // Try RPC
      const { data, error } = await supabase
        .rpc('book_pilates_class', { 
          p_user_id: deposit.user_id, 
          p_slot_id: slot.id 
        });

      if (error) {
        console.log(`   ❌ RPC Error: ${error.message}`);
      } else {
        console.log(`   📊 RPC Result:`, JSON.stringify(data));
        
        // Check if booking was created
        const { data: newBooking } = await supabase
          .from('pilates_bookings')
          .select('*')
          .eq('user_id', deposit.user_id)
          .eq('slot_id', slot.id)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (newBooking) {
          console.log(`   ✅ Booking created: ${newBooking.id}`);
          
          // Cancel it
          await supabase.rpc('cancel_pilates_booking', { p_booking_id: newBooking.id });
          console.log(`   🧹 Cleaned up`);
        } else {
          console.log(`   ❌ No booking found in DB after RPC!`);
        }
      }
      
      break; // Try only first available user
    }
  }
}

checkExistingBookings().catch(console.error);

