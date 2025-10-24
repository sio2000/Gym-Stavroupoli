// SAFE single test without cleanup
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function safeTest() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  SAFE TEST - Single Booking (No Cleanup)                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Use one test user
  const userId = '017fea7a-8642-4767-8a6d-1702608d5b51'; // Φιλιππος
  
  // Check user deposit
  const { data: deposit } = await supabase
    .from('pilates_deposits')
    .select('deposit_remaining')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  console.log(`👤 User: Φιλιππος Πασχαλουδης`);
  console.log(`💰 Deposit: ${deposit?.deposit_remaining || 0} classes\n`);

  if (!deposit || deposit.deposit_remaining <= 0) {
    console.log('❌ User has no deposit - test skipped');
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

  if (!slots || slots.length === 0) {
    console.log('❌ No available slots');
    return;
  }

  const slot = slots[0];
  console.log(`📅 Slot: ${slot.date} ${slot.start_time}\n`);

  // Check existing bookings
  const { data: existing } = await supabase
    .from('pilates_bookings')
    .select('id, status')
    .eq('user_id', userId)
    .eq('slot_id', slot.id);

  if (existing && existing.length > 0) {
    console.log(`⚠️  User already has booking for this slot:`);
    existing.forEach(b => console.log(`   - ${b.status}`));
    console.log('');
  }

  // Make booking
  console.log('🎯 Making booking via RPC...');
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('book_pilates_class', { p_user_id: userId, p_slot_id: slot.id });

  if (rpcError) {
    console.log(`❌ RPC Error: ${rpcError.message}`);
    return;
  }

  console.log(`\n📊 RPC Response:`);
  console.log(JSON.stringify(rpcData, null, 2));

  const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;

  if (!bookingId) {
    console.log('\n❌ NO BOOKING ID RETURNED!');
    console.log('❌ This is the problem we\'re trying to fix!');
    return;
  }

  console.log(`\n✅ Booking ID: ${bookingId}`);

  // Verify booking exists
  const { data: booking } = await supabase
    .from('pilates_bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (booking) {
    console.log(`\n✅ Booking exists in DB!`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Created: ${booking.created_at}`);
    
    // Check deposit
    const { data: depositAfter } = await supabase
      .from('pilates_deposits')
      .select('deposit_remaining')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    console.log(`\n💰 Deposit:`);
    console.log(`   Before: ${deposit.deposit_remaining}`);
    console.log(`   After:  ${depositAfter?.deposit_remaining || 'N/A'}`);
    console.log(`   Diff:   ${deposit.deposit_remaining - (depositAfter?.deposit_remaining || 0)}`);

    if (depositAfter && depositAfter.deposit_remaining === deposit.deposit_remaining - 1) {
      console.log(`\n✅ DEPOSIT DECREMENTED CORRECTLY!`);
    } else {
      console.log(`\n❌ DEPOSIT NOT DECREMENTED!`);
    }

    // Cancel booking for cleanup
    console.log(`\n🧹 Cancelling booking...`);
    await supabase.rpc('cancel_pilates_booking', { p_booking_id: bookingId });
    console.log(`✅ Cleaned up`);
  } else {
    console.log(`\n❌ Booking NOT FOUND in DB!`);
  }

  console.log('\n' + '═'.repeat(60));
}

safeTest().catch(console.error);

