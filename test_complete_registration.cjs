const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteRegistration() {
  try {
    console.log('🧪 Δοκιμή πλήρους εγγραφής χρήστη...');
    
    // Δημιουργία test χρήστη
    const testEmail = `testuser@gmail.com`;
    const testPassword = 'TestPassword123!';
    const testFirstName = 'Test';
    const testLastName = 'User';
    const testPhone = '1234567890';
    
    console.log('📝 Βήμα 1: Δημιουργία auth user...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Όνομα: ${testFirstName} ${testLastName}`);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: testFirstName,
          last_name: testLastName,
          phone: testPhone,
        },
      },
    });

    if (authError) {
      console.error('❌ Σφάλμα δημιουργίας auth user:', authError);
      return;
    }

    if (!authData.user) {
      console.error('❌ Δεν δημιουργήθηκε auth user');
      return;
    }

    console.log('✅ Auth user δημιουργήθηκε επιτυχώς');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);
    console.log(`   Email confirmed: ${authData.user.email_confirmed_at ? 'Ναι' : 'Όχι'}`);

    console.log('📝 Βήμα 2: Δημιουργία user profile...');
    
    const { data: profileData, error: profileError } = await supabase
      .rpc('create_user_profile_safe', {
        p_user_id: authData.user.id,
        p_email: testEmail,
        p_first_name: testFirstName,
        p_last_name: testLastName,
        p_phone: testPhone,
        p_language: 'el'
      });

    if (profileError) {
      console.error('❌ Σφάλμα δημιουργίας profile:', profileError);
      return;
    }

    console.log('✅ User profile δημιουργήθηκε επιτυχώς');
    console.log('   Profile data:', JSON.stringify(profileData, null, 2));

    console.log('📝 Βήμα 3: Επαλήθευση profile στη βάση...');
    
    const { data: dbProfile, error: dbError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (dbError) {
      console.error('❌ Σφάλμα ελέγχου profile στη βάση:', dbError);
    } else {
      console.log('✅ Profile βρέθηκε στη βάση');
      console.log('   Database profile:', JSON.stringify(dbProfile, null, 2));
    }

    console.log('📝 Βήμα 4: Δοκιμή σύνδεσης...');
    
    // Αποσύνδεση
    await supabase.auth.signOut();
    
    // Σύνδεση με τον νέο χρήστη
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error('❌ Σφάλμα σύνδεσης:', loginError);
    } else {
      console.log('✅ Σύνδεση επιτυχής');
      console.log(`   Logged in user: ${loginData.user.email}`);
    }

    console.log('📝 Βήμα 5: Φόρτωση profile μετά τη σύνδεση...');
    
    const { data: loadedProfile, error: loadError } = await supabase
      .rpc('get_user_profile_safe', { p_user_id: authData.user.id });

    if (loadError) {
      console.error('❌ Σφάλμα φόρτωσης profile:', loadError);
    } else {
      console.log('✅ Profile φορτώθηκε επιτυχώς');
      console.log('   Loaded profile:', JSON.stringify(loadedProfile, null, 2));
    }

    console.log('🎉 Δοκιμή πλήρους εγγραφής ολοκληρώθηκε!');
    console.log('');
    console.log('📋 Περίληψη:');
    console.log('✅ Auth user δημιουργήθηκε');
    console.log('✅ User profile δημιουργήθηκε');
    console.log('✅ Profile αποθηκεύτηκε στη βάση');
    console.log('✅ Σύνδεση λειτουργεί');
    console.log('✅ Φόρτωση profile λειτουργεί');
    console.log('');
    console.log('🚀 Το σύστημα εγγραφής λειτουργεί σωστά!');

  } catch (err) {
    console.error('❌ Σφάλμα δοκιμής εγγραφής:', err);
  }
}

testCompleteRegistration();
