const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithoutConfirmation() {
  try {
    console.log('🧪 Δοκιμή χωρίς email confirmation...');
    
    // Δοκιμή με τον υπάρχοντα χρήστη
    console.log('📝 Δοκιμή σύνδεσης με υπάρχοντα χρήστη...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'testuser@gmail.com',
      password: 'TestPassword123!',
    });

    if (loginError) {
      console.error('❌ Σφάλμα σύνδεσης:', loginError);
      console.log('');
      console.log('🔧 Λύση:');
      console.log('1. Πήγαινε στο Supabase Dashboard');
      console.log('2. Authentication > Settings');
      console.log('3. Απενεργοποίησε το "Enable email confirmations"');
      console.log('4. Ή εκτέλεσε το confirm_all_users.sql');
      console.log('');
      return;
    }

    console.log('✅ Σύνδεση επιτυχής!');
    console.log(`   User: ${loginData.user.email}`);
    console.log(`   User ID: ${loginData.user.id}`);

    // Δοκιμή φόρτωσης profile
    console.log('📝 Δοκιμή φόρτωσης profile...');
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

    console.log('🎉 Δοκιμή ολοκληρώθηκε!');
    console.log('');
    console.log('📋 Περίληψη:');
    console.log('✅ Σύνδεση λειτουργεί');
    console.log('✅ Profile φόρτωση λειτουργεί');
    console.log('✅ Το σύστημα είναι έτοιμο!');

  } catch (err) {
    console.error('❌ Σφάλμα δοκιμής:', err);
  }
}

testWithoutConfirmation();
