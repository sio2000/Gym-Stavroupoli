// Check if RPC is actually working
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkRPC() {
  console.log('\n🔍 Checking RPC implementation...\n');

  // Find a user with deposit
  const { data: deposits } = await supabase
    .from('pilates_deposits')
    .select('user_id, deposit_remaining')
    .eq('is_active', true)
    .gt('deposit_remaining', 0)
    .limit(1)
    .single();

  if (!deposits) {
    console.log('❌ No active deposits found');
    return;
  }

  console.log(`✅ Found user with deposit: ${deposits.deposit_remaining}`);

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

  console.log(`✅ Found slot: ${slot.date} ${slot.start_time}`);

  // Try RPC
  console.log('\n🎯 Testing RPC call...');
  const { data, error } = await supabase
    .rpc('book_pilates_class', { 
      p_user_id: deposits.user_id, 
      p_slot_id: slot.id 
    });

  console.log('\n📊 RPC Response:');
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Error:', error);

  if (error) {
    console.log('\n❌ RPC ERROR:', error.message);
    console.log('\n🔍 Checking if function exists...');
    
    const { data: func } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'book_pilates_class')
      .single();
    
    console.log('Function exists:', func ? 'YES' : 'NO');
    
    // Check recent bookings to verify if RPC worked
    const { data: recentBookings } = await supabase
      .from('pilates_bookings')
      .select('*')
      .eq('user_id', deposits.user_id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('\n📋 Recent bookings for this user:');
    console.log(JSON.stringify(recentBookings, null, 2));
  } else {
    console.log('\n✅ RPC SUCCESS!');
    console.log('Return value:', data);
  }
}

checkRPC().catch(console.error);

