const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegistrationFix() {
  try {
    console.log('🧪 Δοκιμή διόρθωσης εγγραφής...');
    console.log('');
    
    // Δημιουργία unique test email
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';
    const testFirstName = 'Test';
    const testLastName = 'User';
    const testPhone = '1234567890';
    
    console.log('📝 Βήμα 1: Δημιουργία νέου χρήστη...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Όνομα: ${testFirstName} ${testLastName}`);
    console.log('');
    
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
      console.error('❌ Σφάλμα δημιουργίας χρήστη:', authError);
      return;
    }

    if (!authData.user) {
      console.error('❌ Δεν δημιουργήθηκε χρήστης');
      return;
    }

    console.log('✅ Χρήστης δημιουργήθηκε επιτυχώς');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);
    console.log(`   Email confirmed: ${authData.user.email_confirmed_at ? 'Ναι' : 'Όχι'}`);
    console.log('');

    // Έλεγχος αν το email είναι επιβεβαιωμένο
    if (authData.user.email_confirmed_at === null) {
      console.log('⚠️  Email δεν είναι επιβεβαιωμένο - αυτό είναι αναμενόμενο');
      console.log('   Το popup θα εμφανιστεί για επιβεβαίωση email');
      console.log('');
      
      console.log('🔧 Για να διορθωθεί το πρόβλημα:');
      console.log('1. Εκτέλεσε το fix_email_confirmation_issue.sql στο Supabase');
      console.log('2. Ή απενεργοποίησε το email confirmation στις ρυθμίσεις');
      console.log('');
      return;
    }

    console.log('📝 Βήμα 2: Έλεγχος δημιουργίας profile...');
    
    // Περίμενε λίγο για το trigger
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Σφάλμα φόρτωσης profile:', profileError);
      console.log('');
      console.log('🔧 Για να διορθωθεί:');
      console.log('1. Εκτέλεσε το fix_email_confirmation_issue.sql');
      console.log('2. Ή δημιούργησε manually το profile');
      return;
    }

    console.log('✅ Profile δημιουργήθηκε επιτυχώς');
    console.log(`   Όνομα: ${profileData.first_name} ${profileData.last_name}`);
    console.log(`   Email: ${profileData.email}`);
    console.log(`   Role: ${profileData.role}`);
    console.log('');

    console.log('📝 Βήμα 3: Δοκιμή σύνδεσης...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error('❌ Σφάλμα σύνδεσης:', loginError);
      return;
    }

    console.log('✅ Σύνδεση επιτυχής!');
    console.log(`   User: ${loginData.user.email}`);
    console.log('');

    console.log('🎉 ΕΠΙΤΥΧΙΑ! Η διόρθωση λειτουργεί σωστά');
    console.log('');
    console.log('📋 Περίληψη:');
    console.log('✅ Δημιουργία χρήστη: OK');
    console.log('✅ Δημιουργία profile: OK');
    console.log('✅ Σύνδεση: OK');
    console.log('');

  } catch (error) {
    console.error('❌ Σφάλμα κατά τη δοκιμή:', error);
    console.log('');
    console.log('🔧 Πιθανές λύσεις:');
    console.log('1. Εκτέλεσε το fix_email_confirmation_issue.sql');
    console.log('2. Έλεγξε τις ρυθμίσεις του Supabase');
    console.log('3. Έλεγξε το database trigger');
  }
}

// Εκτέλεση του test
testRegistrationFix();
