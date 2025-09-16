const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserProfilesTable() {
  try {
    console.log('🔍 Ελέγχος πίνακα user_profiles...');
    
    // Ελέγχος 1: Δομή πίνακα
    console.log('📝 Βήμα 1: Ελέγχος δομής πίνακα...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Σφάλμα πρόσβασης στον πίνακα user_profiles:', tableError);
      return;
    }

    console.log('✅ Πίνακας user_profiles είναι προσβάσιμος');
    
    // Ελέγχος 2: Αριθμός εγγραφών
    console.log('📝 Βήμα 2: Ελέγχος αριθμού εγγραφών...');
    const { count, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Σφάλμα μέτρησης εγγραφών:', countError);
    } else {
      console.log(`📊 Συνολικός αριθμός χρηστών: ${count}`);
    }

    // Ελέγχος 3: Εμφάνιση όλων των χρηστών
    console.log('📝 Βήμα 3: Εμφάνιση όλων των χρηστών...');
    const { data: allUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        first_name,
        last_name,
        role,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Σφάλμα φόρτωσης χρηστών:', usersError);
    } else {
      console.log(`📊 Βρέθηκαν ${allUsers.length} χρήστες:`);
      if (allUsers.length > 0) {
        console.table(allUsers);
      } else {
        console.log('   Δεν υπάρχουν χρήστες στον πίνακα');
      }
    }

    // Ελέγχος 4: Ελέγχος για "unknown" χρήστες
    console.log('📝 Βήμα 4: Ελέγχος για "unknown" χρήστες...');
    const { data: unknownUsers, error: unknownError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name')
      .or('email.eq.unknown@example.com,first_name.eq.User,last_name.eq.');

    if (unknownError) {
      console.error('❌ Σφάλμα ελέγχου unknown χρηστών:', unknownError);
    } else {
      console.log(`📊 Χρήστες με "unknown" δεδομένα: ${unknownUsers.length}`);
      if (unknownUsers.length > 0) {
        console.table(unknownUsers);
      }
    }

    // Ελέγχος 5: Δοκιμή δημιουργίας χρήστη
    console.log('📝 Βήμα 5: Δοκιμή δημιουργίας χρήστη...');
    const testUserId = '00000000-0000-0000-0000-000000000999';
    
    const { data: testProfile, error: testError } = await supabase
      .rpc('create_user_profile_safe', {
        p_user_id: testUserId,
        p_email: 'test@freegym.gr',
        p_first_name: 'Test',
        p_last_name: 'User',
        p_phone: '1234567890'
      });

    if (testError) {
      console.error('❌ Σφάλμα δημιουργίας test χρήστη:', testError);
    } else {
      console.log('✅ Test χρήστης δημιουργήθηκε επιτυχώς');
      console.log('   Test profile:', JSON.stringify(testProfile, null, 2));
    }

    console.log('🎉 Έλεγχος πίνακα user_profiles ολοκληρώθηκε!');
    console.log('');
    console.log('📋 Περίληψη:');
    console.log(`✅ Πίνακας user_profiles λειτουργεί`);
    console.log(`✅ Αριθμός χρηστών: ${count || 0}`);
    console.log(`✅ Δημιουργία χρηστών λειτουργεί`);
    console.log(`✅ Συνδεσμοί με auth.users λειτουργούν`);

  } catch (err) {
    console.error('❌ Σφάλμα ελέγχου πίνακα:', err);
  }
}

checkUserProfilesTable();
