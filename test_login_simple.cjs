const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginSimple() {
  try {
    console.log('🧪 Απλή δοκιμή σύνδεσης...');
    
    // Δοκιμή σύνδεσης
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'dayeyeg183@ishense.com',
      password: 'TestPassword123!', // Αυτό μπορεί να μην είναι σωστό
    });

    if (loginError) {
      console.error('❌ Σφάλμα σύνδεσης:', loginError);
      console.log('   Δοκίμασε με το σωστό password');
      return;
    }

    console.log('✅ Σύνδεση επιτυχής!');
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}`);

    // Δοκιμή φόρτωσης profile
    console.log('📝 Φόρτωση profile...');
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_user_profile_safe', { p_user_id: loginData.user.id });

    if (profileError) {
      console.error('❌ Σφάλμα φόρτωσης profile:', profileError);
    } else {
      console.log('✅ Profile φορτώθηκε επιτυχώς!');
      console.log(`   Όνομα: ${profileData.first_name} ${profileData.last_name}`);
      console.log(`   Email: ${profileData.email}`);
      console.log(`   Role: ${profileData.role}`);
    }

    console.log('🎉 Δοκιμή σύνδεσης ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα δοκιμής:', err);
  }
}

testLoginSimple();
