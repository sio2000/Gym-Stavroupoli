// Script για έλεγχο των πινάκων που χρειαζόμαστε για το developer settings
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tablesToCheck = ['audit_logs', 'payments', 'pilates_deposits', 'user_profiles'];

  console.log('🔍 Ελέγχω τους πίνακες που χρειαζόμαστε...\n');

  for (const tableName of tablesToCheck) {
    console.log(`\n📋 Έλεγχος πίνακα: ${tableName}`);

    try {
      // Ελέγχω αν υπάρχει ο πίνακας κάνοντας ένα απλό select
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Πίνακας ${tableName} δεν είναι προσβάσιμος:`, error.message);
      } else {
        console.log(`✅ Πίνακας ${tableName} υπάρχει και έχει ${count} εγγραφές`);

        // Αν έχει δεδομένα, πάρε ένα sample
        if (count > 0) {
          const { data: sample, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (!sampleError && sample && sample.length > 0) {
            console.log(`📊 Sample record:`, JSON.stringify(sample[0], null, 2));
          }
        }
      }
    } catch (err) {
      console.log(`❌ Σφάλμα κατά τον έλεγχο του πίνακα ${tableName}:`, err.message);
    }
  }

  console.log('\n🎯 Έλεγχος ολοκληρώθηκε!');
}

checkTables().catch(console.error);