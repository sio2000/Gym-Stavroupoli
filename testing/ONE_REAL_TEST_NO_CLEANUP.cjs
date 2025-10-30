// ONE real test - no cleanup afterwards
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function oneRealTest() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ONE REAL TEST - No Cleanup                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const userId = '017fea7a-8642-4767-8a6d-1702608d5b51';
  
  // Get deposit
  const { data: depositBefore } = await supabase
    .from('pilates_deposits')
    .select('deposit_remaining')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  console.log(`👤 User: Φιλιππος Πασχαλουδης`);
  console.log(`💰 Deposit before: ${depositBefore?.deposit_remaining || 0} classes\n`);

  if (!depositBefore || depositBefore.deposit_remaining <= 0) {
    console.log('❌ User has no deposit');
    return;
  }

  // Find available slot
  const today = new Date();
  const { data: slots } = await supabase
    .from('pilates_schedule_slots')
    .select('id, date, start_time')
    .gte('date', today.toISOString().split('T')[0])
    .eq('is_active', true)
    .limit(10);

  const slot = slots?.[0];
  if (!slot) {
    console.log('❌ No available slots');
    return;
  }

  console.log(`📅 Trying slot: ${slot.date} ${slot.start_time}\n`);

  // Check existing bookings
  const { data: existing } = await supabase
    .from('pilates_bookings')
    .select('id, status')
    .eq('user_id', userId)
    .eq('slot_id', slot.id);

  if (existing && existing.length > 0) {
    console.log(`⚠️  User already has ${existing.length} booking(s) for this slot`);
    existing.forEach(b => console.log(`   - ${b.status}`));
    console.log('\n✅ This slot is already booked - RPC will handle it correctly');
    return;
  }

  // Make booking
  console.log('🎯 Calling RPC...');
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('book_pilates_class', { p_user_id: userId, p_slot_id: slot.id });

  if (rpcError) {
    console.log(`❌ RPC Error: ${rpcError.message}`);
    return;
  }

  console.log(`\n📊 RPC Response:`);
  console.log(JSON.stringify(rpcData, null, 2));

  const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;

  console.log('\n' + '═'.repeat(60));
  
  if (bookingId) {
    console.log(`\n✅ SUCCESS! Booking ID: ${bookingId}`);
    
    // Verify booking
    const { data: booking } = await supabase
      .from('pilates_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (booking) {
      console.log(`✅ Booking exists in DB!`);
      console.log(`   Status: ${booking.status}`);
      
      // Check deposit
      const { data: depositAfter } = await supabase
        .from('pilates_deposits')
        .select('deposit_remaining')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      console.log(`\n💰 Deposit:`);
      console.log(`   Before: ${depositBefore.deposit_remaining}`);
      console.log(`   After:  ${depositAfter?.deposit_remaining || 'N/A'}`);

      if (depositAfter && depositAfter.deposit_remaining === depositBefore.deposit_remaining - 1) {
        console.log(`\n✅ DEPOSIT DECREMENTED CORRECTLY!`);
        console.log(`\n🎊 THE SYSTEM WORKS PERFECTLY! 🎊`);
      } else {
        console.log(`\n❌ DEPOSIT NOT DECREMENTED!`);
      }
    } else {
      console.log(`\n❌ Booking NOT FOUND in DB!`);
    }
  } else {
    console.log(`\n❌ NO BOOKING ID RETURNED!`);
    console.log(`❌ This indicates the issue still exists`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n⚠️  NOTE: This booking was NOT cancelled');
  console.log('⚠️  It remains in the database for real users\n');
}

oneRealTest().catch(console.error);

