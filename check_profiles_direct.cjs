const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesDirect() {
  try {
    console.log('🔍 Άμεσος έλεγχος profiles...');
    
    // Ελέγχος με RPC function
    console.log('📝 Ελέγχος με get_user_profile_safe...');
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_user_profile_safe', { p_user_id: 'ef5bc33c-77ca-4da3-b8e6-27829ffc66ef' });

    if (profileError) {
      console.error('❌ Σφάλμα RPC function:', profileError);
    } else {
      console.log('✅ RPC function λειτουργεί');
      console.log('   Profile data:', JSON.stringify(profileData, null, 2));
    }

    // Ελέγχος με direct query
    console.log('📝 Ελέγχος με direct query...');
    const { data: directData, error: directError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', 'ef5bc33c-77ca-4da3-b8e6-27829ffc66ef');

    if (directError) {
      console.error('❌ Σφάλμα direct query:', directError);
    } else {
      console.log('✅ Direct query λειτουργεί');
      console.log(`   Βρέθηκαν ${directData.length} profiles`);
      if (directData.length > 0) {
        console.log('   Profile data:', JSON.stringify(directData[0], null, 2));
      }
    }

    // Ελέγχος όλων των profiles
    console.log('📝 Ελέγχος όλων των profiles...');
    const { data: allData, error: allError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name, created_at');

    if (allError) {
      console.error('❌ Σφάλμα ελέγχου όλων:', allError);
    } else {
      console.log(`✅ Ελέγχος όλων ολοκληρώθηκε`);
      console.log(`   Συνολικά profiles: ${allData.length}`);
      if (allData.length > 0) {
        console.table(allData);
      }
    }

    console.log('🎉 Άμεσος έλεγχος ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα ελέγχου:', err);
  }
}

checkProfilesDirect();
