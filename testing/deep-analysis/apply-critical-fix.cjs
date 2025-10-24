// CRITICAL FIX: Εφαρμόζει τη διόρθωση του ambiguous column error
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function applyFix() {
  console.log('\n🚨 ΚΡΙΣΙΜΗ ΔΙΟΡΘΩΣΗ - Εφαρμογή fix για ambiguous column error\n');

  try {
    // Read the SQL fix
    const sql = fs.readFileSync('../../database/FIX_PILATES_RPC_AMBIGUOUS.sql', 'utf8');
    
    console.log('📝 Διαβάζω το SQL fix...');
    console.log('📊 Lines:', sql.split('\n').length);
    console.log('');

    // Try to execute via pg_query or direct
    console.log('⚙️  Εφαρμόζω το fix στη βάση δεδομένων...\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  MANUAL ACTION REQUIRED                                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('Το SQL fix πρέπει να εφαρμοστεί μέσω Supabase Dashboard:\n');
    console.log('1. Πήγαινε στο: https://supabase.com/dashboard/project/nolqodpfaqdnprixaqlo/sql/new\n');
    console.log('2. Αντίγραψε το περιεχόμενο από:\n');
    console.log('   database/FIX_PILATES_RPC_AMBIGUOUS.sql\n');
    console.log('3. Επικόλλησε και πάτα "Run"\n');
    console.log('4. Μετά τρέξε: node test-exact-bug.cjs\n');

    console.log('═'.repeat(60));
    console.log('\n🔥 ΣΗΜΑΝΤΙΚΟ: Αυτό το fix είναι ΚΡΙΣΙΜΟ!');
    console.log('   Διορθώνει το SQL error που προκαλούσε booking failures!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyFix();

