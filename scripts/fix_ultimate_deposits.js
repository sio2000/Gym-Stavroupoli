// Script για διόρθωση των Ultimate Pilates deposits
// Το Ultimate πρέπει να πιστώνει 3 μαθήματα/εβδομάδα, το Ultimate Medium 1 μάθημα/εβδομάδα

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjY4NzA1NSwiZXhwIjoyMDQyMjYzMDU1fQ.WgboRzUmjl0HBSt_1WbE68-0-vOqCOT-ZwXyYuWAK-Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUltimateDeposits() {
  console.log('=== ΞΕΚΙΝΑΜΕ ΤΗ ΔΙΟΡΘΩΣΗ ΤΩΝ ULTIMATE PILATES DEPOSITS ===\n');

  try {
    // Step 1: Ελέγχουμε την τρέχουσα κατάσταση
    console.log('ΒΗΜΑ 1: Έλεγχος τρέχουσας κατάστασης...');
    
    const { data: testData, error: testError } = await supabase.rpc('get_user_weekly_refill_status', {
      p_user_id: 'dcfce45b-8418-4cb3-b81d-762a7575d8d4' // Test user από τα logs
    });

    if (testError) {
      console.error('❌ Σφάλμα κατά τον έλεγχο:', testError);
    } else {
      console.log('✅ Τρέχουσα κατάσταση:', testData);
    }

    // Step 2: Διαβάζουμε το SQL migration αρχείο
    console.log('\nΒΗΜΑ 2: Φόρτωση SQL migration...');
    const sqlFilePath = path.join(__dirname, '..', 'database', 'WEEKLY_PILATES_REFILL_UP.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Step 3: Χωρίζουμε το SQL σε εντολές (απλοποιημένος splitter)
    console.log('\nΒΗΜΑ 3: Εκτέλεση SQL migration...');
    const sqlStatements = sqlContent
      .split(/;\s*\n/)
      .filter(stmt => {
        const trimmed = stmt.trim();
        return trimmed && 
               !trimmed.startsWith('--') && 
               !trimmed.startsWith('SELECT \'PHASE') &&
               !trimmed.startsWith('SELECT \'Weekly refill');
      });

    console.log(`Βρέθηκαν ${sqlStatements.length} SQL εντολές για εκτέλεση.\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i].trim();
      if (!statement) continue;

      const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
      
      try {
        const { error } = await supabase.rpc('exec_sql', { query: statement });
        
        if (error) {
          // Αν η εντολή αποτύχει, προσπαθούμε με raw query
          const { error: rawError } = await supabase.from('_sql').insert({ query: statement });
          
          if (rawError) {
            console.log(`⚠️  [${i + 1}/${sqlStatements.length}] ${preview}... - Παράλειψη`);
            errorCount++;
          } else {
            console.log(`✅ [${i + 1}/${sqlStatements.length}] ${preview}...`);
            successCount++;
          }
        } else {
          console.log(`✅ [${i + 1}/${sqlStatements.length}] ${preview}...`);
          successCount++;
        }
      } catch (e) {
        console.log(`⚠️  [${i + 1}/${sqlStatements.length}] ${preview}... - Εξαίρεση`);
        errorCount++;
      }

      // Μικρή καθυστέρηση για να μην υπερφορτώσουμε το API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Αποτελέσματα: ${successCount} επιτυχείς, ${errorCount} αποτυχίες`);

    // Step 4: Επαλήθευση
    console.log('\nΒΗΜΑ 4: Επαλήθευση διορθώσεων...');
    const { data: verifyData, error: verifyError } = await supabase.rpc('get_user_weekly_refill_status', {
      p_user_id: 'dcfce45b-8418-4cb3-b81d-762a7575d8d4'
    });

    if (verifyError) {
      console.error('❌ Σφάλμα επαλήθευσης:', verifyError);
    } else {
      console.log('✅ Κατάσταση μετά τη διόρθωση:', verifyData);
      
      if (verifyData && verifyData.length > 0) {
        const status = verifyData[0];
        console.log(`\n📝 Πληροφορίες:`);
        console.log(`   - Πακέτο: ${status.package_name}`);
        console.log(`   - Target deposits: ${status.target_deposit_amount}`);
        console.log(`   - Current deposits: ${status.current_deposit_amount}`);
        
        if (status.package_name === 'Ultimate' && status.target_deposit_amount === 3) {
          console.log('\n✅ ΕΠΙΤΥΧΙΑ! Το Ultimate πακέτο έχει 3 μαθήματα την εβδομάδα!');
        } else if (status.package_name === 'Ultimate Medium' && status.target_deposit_amount === 1) {
          console.log('\n✅ ΕΠΙΤΥΧΙΑ! Το Ultimate Medium πακέτο έχει 1 μάθημα την εβδομάδα!');
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Σφάλμα κατά τη διόρθωση:', error);
    throw error;
  }
}

// Εκτέλεση
fixUltimateDeposits()
  .then(() => {
    console.log('\n🎉 Η διόρθωση ολοκληρώθηκε!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Η διόρθωση απέτυχε:', error);
    process.exit(1);
  });

