const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginWithUser() {
  try {
    console.log('🧪 Δοκιμή σύνδεσης με συγκεκριμένο χρήστη...');
    
    // Δοκιμή σύνδεσης με τον χρήστη που αντιμετωπίζει πρόβλημα
    const testEmail = 'yevor88047@kwifa.com';
    const testPassword = 'TestPassword123!'; // Αυτό μπορεί να μην είναι σωστό
    
    console.log('📝 Βήμα 1: Προσπάθεια σύνδεσης...');
    console.log(`   Email: ${testEmail}`);
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error('❌ Σφάλμα σύνδεσης:', loginError);
      console.log('   Αυτό μπορεί να οφείλεται σε λάθος password');
      console.log('   Ή το email μπορεί να μην έχει επιβεβαιωθεί');
      return;
    }

    console.log('✅ Σύνδεση επιτυχής!');
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}`);
    console.log(`   Email confirmed: ${loginData.user.email_confirmed_at ? 'Ναι' : 'Όχι'}`);

    console.log('📝 Βήμα 2: Φόρτωση profile μετά τη σύνδεση...');
    
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_user_profile_safe', { p_user_id: loginData.user.id });

    if (profileError) {
      console.error('❌ Σφάλμα φόρτωσης profile:', profileError);
    } else {
      console.log('✅ Profile φορτώθηκε επιτυχώς!');
      console.log('   Profile data:', JSON.stringify(profileData, null, 2));
    }

    console.log('📝 Βήμα 3: Ελέγχος session...');
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Σφάλμα ελέγχου session:', sessionError);
    } else {
      console.log('✅ Session ελέγχος επιτυχής');
      console.log(`   Session active: ${sessionData.session ? 'Ναι' : 'Όχι'}`);
    }

    console.log('🎉 Δοκιμή σύνδεσης ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα δοκιμής σύνδεσης:', err);
  }
}

testLoginWithUser();
