const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function readAllUserProfiles() {
  try {
    console.log('=== ΔΙΑΒΑΣΜΑ ΟΛΟΚΛΗΡΟΥ ΠΙΝΑΚΑ USER_PROFILES ===\n');
    
    // Διάβασμα όλων των προφίλ
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at');

    if (error) {
      console.error('Σφάλμα:', error);
      return;
    }

    console.log(`Συνολικά προφίλ: ${profiles.length}\n`);
    
    // Εμφάνιση όλων των προφίλ
    profiles.forEach((profile, index) => {
      console.log(`--- ΠΡΟΦΙΛ ${index + 1} ---`);
      console.log(`ID: ${profile.id}`);
      console.log(`User ID: ${profile.user_id}`);
      console.log(`Email: ${profile.email}`);
      console.log(`Όνομα: ${profile.first_name}`);
      console.log(`Επώνυμο: ${profile.last_name}`);
      console.log(`Τηλέφωνο: ${profile.phone}`);
      console.log(`Ρόλος: ${profile.role}`);
      console.log(`Γλώσσα: ${profile.language}`);
      console.log(`Ημερομηνία Δημιουργίας: ${profile.created_at}`);
      console.log(`Τελευταία Ενημέρωση: ${profile.updated_at}`);
      console.log('---\n');
    });

    // Στατιστικά για μαλακίες
    const testEmails = profiles.filter(p => p.email && p.email.includes('test')).length;
    const invalidFirstNames = profiles.filter(p => !p.first_name || p.first_name === '' || p.first_name.includes('test')).length;
    const invalidLastNames = profiles.filter(p => !p.last_name || p.last_name === '' || p.last_name.includes('test')).length;
    const invalidPhones = profiles.filter(p => !p.phone || p.phone === '' || p.phone.includes('test')).length;

    console.log('=== ΣΤΑΤΙΣΤΙΚΑ ΜΑΛΑΚΙΩΝ ===');
    console.log(`Test emails: ${testEmails}`);
    console.log(`Άκυρα ονόματα: ${invalidFirstNames}`);
    console.log(`Άκυρα επώνυμα: ${invalidLastNames}`);
    console.log(`Άκυρα τηλέφωνα: ${invalidPhones}`);

  } catch (error) {
    console.error('Σφάλμα:', error);
  }
}

readAllUserProfiles();
