// Restore deposits for users who had deposits but ran out
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function restoreRemainingDeposits() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ΑΠΟΚΑΤΑΣΤΑΣΗ DEPOSITS ΓΙΑ ΟΣΟΥΣ ΤΕΛΕΙΩΣΑΝ            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const usersToRestore = {
    '3d64309f-b798-4a03-a28a-6c0bbae5e67c': { depositId: '6ab9d7a3-8ae0-4274-bf0a-d363e5595e82', bookings: 25, name: 'κωνσταντινα τζηκα' },
    '4e234264-bec3-42af-947c-ebfceccd7c0f': { depositId: 'b2aece43-17a7-49a8-8021-ecedc8e3e4dc', bookings: 19, name: 'Νενα Παπαδοπουλου' },
    'c22ebf5e-db77-4f23-84a8-1ac45be2ee44': { depositId: 'c871ec86-4006-4fae-9a1c-c4f0d263b894', bookings: 13, name: 'Δημητρα Γκαγκαλουδη' },
    'ff96e258-5782-4d7a-890f-e276e2e3b7de': { depositId: 'e48a3efc-6c64-4cb8-a719-43f6b3167d0b', bookings: 19, name: 'Ελευθερία Τσουρεκα' },
    '5939b88d-65b1-4951-950f-7591895c1df7': { depositId: '60c19379-7ac8-41cc-902f-398d71cb60f9', bookings: 16, name: 'dora dora' }
  };

  for (const [userId, info] of Object.entries(usersToRestore)) {
    const { error } = await supabase
      .from('pilates_deposits')
      .update({ 
        deposit_remaining: info.bookings,
        is_active: true 
      })
      .eq('id', info.depositId);

    if (error) {
      console.log(`❌ ${info.name}: ${error.message}`);
    } else {
      console.log(`✅ ${info.name}: 0 → ${info.bookings} μαθήματα (+is_active)`);
    }
  }

  console.log('\n═'.repeat(60));
  console.log('\n🎊 ΟΛΟΙ ΟΙ ΧΡΗΣΤΕΣ ΕΧΟΥΝ ΤΩΡΑ TA DEPOSITS ΤΟΥΣ!\n');
}

restoreRemainingDeposits().catch(console.error);

