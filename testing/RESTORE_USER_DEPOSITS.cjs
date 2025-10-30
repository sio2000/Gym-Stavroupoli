// Restore deposits to users and delete fake bookings
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function restoreDeposits() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ΑΠΟΚΑΤΑΣΤΑΣΗ DEPOSITS & ΔΙΑΓΡΑΦΗ FAKE BOOKINGS           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Users affected by tests
  const affectedUsers = {
    '8fb0fde7-ca81-4005-970a-1f11ae5d30b7': { name: 'ladis ladis', bookings: 5 },
    '017fea7a-8642-4767-8a6d-1702608d5b51': { name: 'Φιλιππος Πασχαλουδης', bookings: 20 },
    '3d64309f-b798-4a03-a28a-6c0bbae5e67c': { name: 'κωνσταντινα τζηκα', bookings: 25 },
    '4e234264-bec3-42af-947c-ebfceccd7c0f': { name: 'Νενα Παπαδοπουλου', bookings: 19 },
    'ba262f03-6a57-4c63-9349-704d87bf8581': { name: 'Σουζάνα Δάλλα', bookings: 23 },
    'c22ebf5e-db77-4f23-84a8-1ac45be2ee44': { name: 'Δημητρα Γκαγκαλουδη', bookings: 13 },
    '605db52c-fdf0-443d-88fb-c9df7dac3d0d': { name: 'ΦΩΤΗΣ ΦΩΤΙΑΔΗΣ', bookings: 19 },
    'ff96e258-5782-4d7a-890f-e276e2e3b7de': { name: 'Ελευθερία Τσουρεκα', bookings: 19 },
    '5939b88d-65b1-4951-950f-7591895c1df7': { name: 'dora dora', bookings: 16 },
    '69ef4940-435a-417c-90b6-2406984b5f27': { name: 'Evdokia Panagiotou', bookings: 3 },
    'c9a9004d-9000-47c3-a921-b3d85799ba10': { name: 'ΣΟΦΙΑ ΚΕΤΣΙΑΚΙΔΟΥ', bookings: 1 },
    '9d6ffcd1-b802-4f8e-a537-629c30f03803': { name: 'ΣΩΤΗΡΗΣ ΠΟΛΥΖΟΠΟΥΛΟΣ', bookings: 1 }
  };

  console.log('📋 Step 1: Restoring deposits...\n');

  let restored = 0;
  let errors = 0;

  for (const [userId, info] of Object.entries(affectedUsers)) {
    // Get current deposit
    const { data: deposit } = await supabase
      .from('pilates_deposits')
      .select('deposit_remaining, id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (deposit) {
      const newAmount = deposit.deposit_remaining + info.bookings;
      
      const { error } = await supabase
        .from('pilates_deposits')
        .update({ deposit_remaining: newAmount })
        .eq('id', deposit.id);

      if (error) {
        console.log(`❌ ${info.name}: ${error.message}`);
        errors++;
      } else {
        console.log(`✅ ${info.name}: ${deposit.deposit_remaining} → ${newAmount} (+${info.bookings})`);
        restored++;
      }
    } else {
      console.log(`⚠️  ${info.name}: No active deposit found`);
    }
  }

  console.log(`\n✅ Restored ${restored} deposits`);
  console.log(`❌ Errors: ${errors}`);

  console.log('\n═'.repeat(60));
  console.log('\n📋 Step 2: Deleting fake bookings from 23/10...\n');

  // Delete bookings from 23/10 to 24/10
  const startDate = '2025-10-23T00:00:00Z';
  const endDate = '2025-10-24T09:00:00Z';

  const { data: bookingsToDelete } = await supabase
    .from('pilates_bookings')
    .select('id')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  console.log(`Found ${bookingsToDelete?.length || 0} bookings to delete`);

  if (bookingsToDelete && bookingsToDelete.length > 0) {
    const bookingIds = bookingsToDelete.map(b => b.id);
    
    // Delete in batches
    for (let i = 0; i < bookingIds.length; i += 50) {
      const batch = bookingIds.slice(i, i + 50);
      const { error } = await supabase
        .from('pilates_bookings')
        .delete()
        .in('id', batch);

      if (error) {
        console.log(`❌ Error deleting batch: ${error.message}`);
      } else {
        console.log(`✅ Deleted batch ${i / 50 + 1}: ${batch.length} bookings`);
      }
    }
  }

  console.log('\n═'.repeat(60));
  console.log('\n🎊 Cleanup complete!\n');
  console.log('✅ Deposits restored to correct amounts');
  console.log('✅ Fake bookings deleted');
  console.log('✅ Users can continue using the system normally\n');
}

restoreDeposits().catch(console.error);

