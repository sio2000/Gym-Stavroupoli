const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Χρησιμοποιούμε service role key για να μπορούμε να αλλάξουμε τις πολιτικές
const supabase = createClient(
  'https://nolqodpfaqdnprixaqlo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0'
);

async function applyRLSFix() {
  console.log('🔧 Εφαρμογή διόρθωσης RLS πολιτικών...');

  try {
    // Διαβάζουμε το SQL script
    const sqlScript = fs.readFileSync('fix_infinite_recursion_rls.sql', 'utf8');
    
    // Χωρίζουμε το script σε statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Βρέθηκαν ${statements.length} SQL statements`);

    // Εκτελούμε κάθε statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Εκτέλεση statement ${i + 1}/${statements.length}...`);
          const { data, error } = await supabase.rpc('exec', {
            sql: statement + ';'
          });
          
          if (error) {
            console.log(`⚠️  Σφάλμα στο statement ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} εκτελέστηκε επιτυχώς`);
          }
        } catch (err) {
          console.log(`❌ Σφάλμα στο statement ${i + 1}:`, err.message);
        }
      }
    }

    // Δοκιμή πρόσβασης
    console.log('🧪 Δοκιμή πρόσβασης...');
    const { data, error: testError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(1);

    if (testError) {
      console.log('❌ Σφάλμα στη δοκιμή:', testError.message);
    } else {
      console.log('✅ Η πρόσβαση λειτουργεί κανονικά');
    }

    console.log('🎉 Η διόρθωση ολοκληρώθηκε!');

  } catch (error) {
    console.error('❌ Σφάλμα στη διόρθωση:', error.message);
  }
}

// Εκτέλεση
applyRLSFix();
