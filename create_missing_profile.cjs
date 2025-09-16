const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingProfile() {
  try {
    console.log('🧪 Δημιουργία missing profile...');
    
    const userId = '2452f158-440a-449c-9332-2e319a1201bb';
    const email = 'dayeyeg183@ishense.com';
    
    console.log('📝 Δημιουργία profile...');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        email: email,
        first_name: 'lol',
        last_name: 'lol',
        phone: '6900000000',
        language: 'el',
        role: 'user',
        referral_code: `REF${userId.substring(0, 8)}`
      })
      .select()
      .single();
    
    console.log('   Profile creation result:', profile);
    console.log('   Profile creation error:', error);
    
    if (error) {
      console.error('❌ Profile creation failed:', error);
      console.log('   Error code:', error.code);
      console.log('   Error message:', error.message);
      console.log('   Error details:', error.details);
    } else {
      console.log('✅ Profile created successfully!');
      console.log('   Profile data:', JSON.stringify(profile, null, 2));
    }

    console.log('📝 Επαλήθευση profile...');
    
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('   Verification result:', verifyProfile);
    console.log('   Verification error:', verifyError);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Profile verified successfully!');
    }

    console.log('🎉 Δημιουργία profile ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα δημιουργίας profile:', err);
  }
}

createMissingProfile();
