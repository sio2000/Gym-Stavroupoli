// Check why some users don't have active deposits
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkNoDepositsUsers() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ΕΛΕΓΧΟΣ ΧΡΗΣΤΩΝ ΧΩΡΙΣ ACTIVE DEPOSITS                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Users who should have deposits but don't
  const usersToCheck = [
    { id: '8fb0fde7-ca81-4005-970a-1f11ae5d30b7', name: 'ladis ladis' },
    { id: '3d64309f-b798-4a03-a28a-6c0bbae5e67c', name: 'κωνσταντινα τζηκα' },
    { id: '4e234264-bec3-42af-947c-ebfceccd7c0f', name: 'Νενα Παπαδοπουλου' },
    { id: 'c22ebf5e-db77-4f23-84a8-1ac45be2ee44', name: 'Δημητρα Γκαγκαλουδη' },
    { id: 'ff96e258-5782-4d7a-890f-e276e2e3b7de', name: 'Ελευθερία Τσουρεκα' },
    { id: '5939b88d-65b1-4951-950f-7591895c1df7', name: 'dora dora' }
  ];

  for (const user of usersToCheck) {
    console.log(`\n👤 ${user.name} (${user.id})`);
    
    // Check ALL deposits (not just active)
    const { data: allDeposits } = await supabase
      .from('pilates_deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!allDeposits || allDeposits.length === 0) {
      console.log('   ❌ ΔΕΝ έχει ΚΑΝΕΝΑ deposit!');
      console.log('   📝 Λόγος: Ποτέ δεν του δόθηκε deposit');
      continue;
    }

    console.log(`   📊 Total deposits: ${allDeposits.length}`);

    // Show each deposit
    allDeposits.forEach((deposit, i) => {
      console.log(`\n   ${i + 1}. Deposit ID: ${deposit.id}`);
      console.log(`      Remaining: ${deposit.deposit_remaining}`);
      console.log(`      Is Active: ${deposit.is_active}`);
      console.log(`      Created: ${deposit.created_at}`);
      console.log(`      Expires: ${deposit.expires_at}`);
      
      if (!deposit.is_active) {
        console.log(`      ❌ REASON: is_active = false`);
      }
      if (deposit.deposit_remaining <= 0) {
        console.log(`      ❌ REASON: deposit_remaining = 0`);
      }
      if (deposit.expires_at && new Date(deposit.expires_at) < new Date()) {
        console.log(`      ❌ REASON: Expired`);
      }
    });

    // Check for refunds
    const { data: refunds } = await supabase
      .from('pilates_bookings')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(5);

    if (refunds && refunds.length > 0) {
      console.log(`\n   📋 Cancelled bookings: ${refunds.length}`);
      console.log(`   ℹ️  Οι cancelled bookings θα έπρεπε να επιστρέψουν τα deposits`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 SUMMARY:\n');
  console.log('Οι χρήστες που δεν έχουν active deposits:');
  console.log('   - Καταναλώσανε τα deposits τους από κρατήσεις');
  console.log('   - Τα deposits τους έληξαν');
  console.log('   - Τα deposits τους σημειώθηκαν ως inactive\n');
}

checkNoDepositsUsers().catch(console.error);

