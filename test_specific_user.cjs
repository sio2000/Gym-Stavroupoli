const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSpecificUser() {
  try {
    console.log('🧪 Δοκιμή συγκεκριμένου χρήστη...');
    
    const userId = 'ae9a80e5-5d80-4ec7-ad76-561add0419e6';
    
    console.log('📝 Βήμα 1: Ελέγχος αν υπάρχει profile στη βάση...');
    
    // Ελέγχος με RPC function
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_user_profile_safe', { p_user_id: userId });

    console.log('📊 RPC Function Result:');
    console.log('   Data:', profileData);
    console.log('   Error:', profileError);
    
    if (profileError) {
      console.error('❌ Σφάλμα RPC function:', profileError);
    } else {
      console.log('✅ RPC function λειτουργεί');
      console.log('   Profile data:', JSON.stringify(profileData, null, 2));
    }

    console.log('📝 Βήμα 2: Ελέγχος με direct query...');
    
    const { data: directData, error: directError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId);

    console.log('📊 Direct Query Result:');
    console.log('   Data:', directData);
    console.log('   Error:', directError);
    console.log('   Count:', directData?.length || 0);

    console.log('📝 Βήμα 3: Ελέγχος auth user...');
    
    // Δοκιμή σύνδεσης
    console.log('   Προσπάθεια σύνδεσης...');
    console.log('   (Θα χρειαστεί να δώσεις τα credentials του χρήστη)');
    
    console.log('📝 Βήμα 4: Δημιουργία profile αν δεν υπάρχει...');
    
    if (!profileData && !directData?.length) {
      console.log('   Δημιουργία νέου profile...');
      
      const { data: createData, error: createError } = await supabase
        .rpc('create_user_profile_safe', {
          p_user_id: userId,
          p_email: 'user@example.com',
          p_first_name: 'Test',
          p_last_name: 'User',
          p_phone: '1234567890',
          p_language: 'el'
        });

      console.log('📊 Create Profile Result:');
      console.log('   Data:', createData);
      console.log('   Error:', createError);
      
      if (createError) {
        console.error('❌ Σφάλμα δημιουργίας profile:', createError);
      } else {
        console.log('✅ Profile δημιουργήθηκε επιτυχώς');
      }
    }

    console.log('🎉 Δοκιμή ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα δοκιμής:', err);
  }
}

testSpecificUser();
