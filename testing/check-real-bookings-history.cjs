// Check real booking history for users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkRealBookings() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ΕΛΕΓΧΟΣ ΠΡΑΓΜΑΤΙΚΩΝ ΚΡΑΤΗΣΕΩΝ ΧΡΗΣΤΩΝ                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const usersToCheck = [
    { id: '3d64309f-b798-4a03-a28a-6c0bbae5e67c', name: 'κωνσταντινα τζηκα', depositId: '6ab9d7a3-8ae0-4274-bf0a-d363e5595e82' },
    { id: '4e234264-bec3-42af-947c-ebfceccd7c0f', name: 'Νενα Παπαδοπουλου', depositId: 'b2aece43-17a7-49a8-8021-ecedc8e3e4dc' },
    { id: 'c22ebf5e-db77-4f23-84a8-1ac45be2ee44', name: 'Δημητρα Γκαγκαλουδη', depositId: 'c871ec86-4006-4fae-9a1c-c4f0d263b894' },
    { id: 'ff96e258-5782-4d7a-890f-e276e2e3b7de', name: 'Ελευθερία Τσουρεκα', depositId: 'e48a3efc-6c64-4cb8-a719-43f6b3167d0b' },
    { id: '5939b88d-65b1-4951-950f-7591895c1df7', name: 'dora dora', depositId: '60c19379-7ac8-41cc-902f-398d71cb60f9' }
  ];

  for (const user of usersToCheck) {
    console.log(`\n👤 ${user.name}`);
    console.log('═'.repeat(60));

    // Check deposit history
    const { data: deposit } = await supabase
      .from('pilates_deposits')
      .select('*')
      .eq('id', user.depositId)
      .single();

    if (deposit) {
      console.log(`\n💰 Deposit Info:`);
      console.log(`   Created: ${deposit.created_at}`);
      console.log(`   Original Amount: ???`);
      console.log(`   Current Remaining: ${deposit.deposit_remaining}`);
      console.log(`   Is Active: ${deposit.is_active}`);
    }

    // Check ALL bookings for this user (before 23/10)
    const { data: oldBookings } = await supabase
      .from('pilates_bookings')
      .select('*')
      .eq('user_id', user.id)
      .lt('created_at', '2025-10-23T00:00:00Z')
      .order('created_at', { ascending: false });

    console.log(`\n📋 Bookings BEFORE 23/10: ${oldBookings?.length || 0}`);

    if (oldBookings && oldBookings.length > 0) {
      console.log(`   Last ${Math.min(5, oldBookings.length)} bookings:`);
      oldBookings.slice(0, 5).forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.status} - ${b.created_at}`);
      });
    }

    // Check bookings from 23/10 (test bookings)
    const { data: testBookings } = await supabase
      .from('pilates_bookings')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', '2025-10-23T00:00:00Z')
      .lte('created_at', '2025-10-24T09:00:00Z');

    console.log(`\n🧪 Test Bookings (23/10): ${testBookings?.length || 0}`);
    console.log(`   ⚠️  Αυτές ήταν οι κρατήσεις από τα tests που διεγράφηκαν`);

    // Calculate: How many classes should they have now?
    const confirmedOld = oldBookings?.filter(b => b.status === 'confirmed').length || 0;
    const cancelledOld = oldBookings?.filter(b => b.status === 'cancelled').length || 0;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Confirmed (old): ${confirmedOld}`);
    console.log(`   Cancelled (old): ${cancelledOld}`);
    console.log(`   Net bookings: ${confirmedOld - cancelledOld}`);
    
    // If deposit was credited, what should be remaining?
    console.log(`\n💡 Analysis:`);
    if (deposit && deposit.deposit_remaining === 0) {
      console.log(`   ❌ Deposit = 0 (άδειο)`);
      console.log(`   ✅ Θα πρέπει να επιστρέψουμε: ${testBookings?.length || 0} μαθήματα από tests`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 CONCLUSION:\n');
  console.log('Οι χρήστες είχαν deposits που τελείωσαν από πραγματικές κρατήσεις.');
  console.log('Τα tests τους έφεραν σε 0, οπότε πρέπει να επιστρέψουμε τα μαθήματα.\n');
}

checkRealBookings().catch(console.error);

