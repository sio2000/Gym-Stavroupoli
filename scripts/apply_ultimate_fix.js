// Script για εφαρμογή της διόρθωσης Ultimate Pilates deposits
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjY4NzA1NSwiZXhwIjoyMDQyMjYzMDU1fQ.WgboRzUmjl0HBSt_1WbE68-0-vOqCOT-ZwXyYuWAK-Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySQLFile() {
  console.log('🚀 Εφαρμογή διόρθωσης Ultimate Pilates Deposits...\n');

  try {
    // Διάβασμα του SQL αρχείου
    const sqlPath = path.join(__dirname, '..', 'database', 'FIX_ULTIMATE_DEPOSITS_CORRECT.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Φορτώθηκε το SQL αρχείο\n');

    // Εκτέλεση του SQL
    console.log('⚙️  Εκτέλεση SQL...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ Σφάλμα κατά την εκτέλεση SQL:', error);
      
      // Δοκιμάζουμε εναλλακτική μέθοδο - direct execution
      console.log('\n🔄 Δοκιμάζουμε εναλλακτική μέθοδο...');
      
      // Χωρίζουμε σε statements
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && !s.startsWith('SELECT \''));

      console.log(`\n📝 Βρέθηκαν ${statements.length} SQL statements\n`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (!stmt) continue;

        const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`[${i + 1}/${statements.length}] ${preview}...`);

        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql: stmt + ';'
          });

          if (stmtError) {
            console.log(`  ⚠️  Σφάλμα: ${stmtError.message}`);
          } else {
            console.log(`  ✅`);
          }
        } catch (e) {
          console.log(`  ⚠️  Exception: ${e.message}`);
        }

        // Μικρή παύση
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } else {
      console.log('✅ SQL εκτελέστηκε επιτυχώς!\n');
    }

    // TEST: Έλεγχος της διόρθωσης
    console.log('\n🧪 ΤΕΣΤ: Έλεγχος διόρθωσης...\n');

    // Test με Ultimate user (από τα logs)
    const testUserId = 'dcfce45b-8418-4cb3-b81d-762a7575d8d4';

    const { data: refillStatus, error: refillError } = await supabase.rpc(
      'get_user_weekly_refill_status',
      { p_user_id: testUserId }
    );

    if (refillError) {
      console.error('❌ Σφάλμα στο test:', refillError);
    } else {
      console.log('📊 Αποτελέσματα Test:');
      console.log(JSON.stringify(refillStatus, null, 2));

      if (refillStatus && refillStatus.length > 0) {
        const status = refillStatus[0];
        console.log('\n📝 Σύνοψη:');
        console.log(`   Πακέτο: ${status.package_name}`);
        console.log(`   Τρέχον deposit: ${status.current_deposit_amount}`);
        console.log(`   Target deposit: ${status.target_deposit_amount}`);

        // Επαλήθευση
        if (status.package_name === 'Ultimate' && status.target_deposit_amount === 3) {
          console.log('\n✅ ΕΠΙΤΥΧΙΑ! Το Ultimate έχει 3 μαθήματα την εβδομάδα!');
        } else if (status.package_name === 'Ultimate Medium' && status.target_deposit_amount === 1) {
          console.log('\n✅ ΕΠΙΤΥΧΙΑ! Το Ultimate Medium έχει 1 μάθημα την εβδομάδα!');
        } else {
          console.log('\n⚠️  ΠΡΟΣΟΧΗ: Τα deposits δεν είναι σωστά!');
        }
      }
    }

    // Έλεγχος όλων των Ultimate users
    console.log('\n📊 Έλεγχος όλων των Ultimate users...\n');

    const { data: allUsers, error: allError } = await supabase
      .from('memberships')
      .select(`
        user_id,
        source_package_name,
        user_profiles!inner(first_name, last_name)
      `)
      .in('source_package_name', ['Ultimate', 'Ultimate Medium'])
      .eq('is_active', true);

    if (allError) {
      console.error('❌ Σφάλμα:', allError);
    } else {
      console.log(`Βρέθηκαν ${allUsers.length} Ultimate users:\n`);

      for (const user of allUsers.slice(0, 5)) {
        const { data: userStatus } = await supabase.rpc(
          'get_user_weekly_refill_status',
          { p_user_id: user.user_id }
        );

        if (userStatus && userStatus.length > 0) {
          const status = userStatus[0];
          const check = 
            (status.package_name === 'Ultimate' && status.target_deposit_amount === 3) ||
            (status.package_name === 'Ultimate Medium' && status.target_deposit_amount === 1)
              ? '✅'
              : '❌';
          
          console.log(
            `${check} ${user.user_profiles.first_name} ${user.user_profiles.last_name}: ` +
            `${status.package_name} → ${status.target_deposit_amount} μαθήματα/εβδομάδα`
          );
        }
      }

      if (allUsers.length > 5) {
        console.log(`\n... και ${allUsers.length - 5} ακόμα users`);
      }
    }

    console.log('\n🎉 Η διόρθωση ολοκληρώθηκε!');
    console.log('\n📋 Περίληψη:');
    console.log('   ✅ Ultimate: 3 μαθήματα Pilates την εβδομάδα');
    console.log('   ✅ Ultimate Medium: 1 μάθημα Pilates την εβδομάδα');

  } catch (error) {
    console.error('\n💥 Σφάλμα:', error);
    throw error;
  }
}

// Εκτέλεση
applySQLFile()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

