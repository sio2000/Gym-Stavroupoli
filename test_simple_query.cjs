const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleQuery() {
  try {
    console.log('🧪 Δοκιμή απλού query...');
    
    const userId = '2452f158-440a-449c-9332-2e319a1201bb';
    
    console.log('📝 Βήμα 1: Δοκιμή απλού select...');
    console.log(`   User ID: ${userId}`);
    
    // Δοκιμή απλού select
    console.log('   Καλώντας απλό select...');
    const startTime = Date.now();
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   Query completed in ${duration}ms`);
    console.log('   Result:', profile);
    console.log('   Error:', error);
    
    if (error) {
      console.error('❌ Query failed:', error);
      console.log('   Error code:', error.code);
      console.log('   Error message:', error.message);
    } else {
      console.log('✅ Query succeeded');
      console.log('   Profile data:', JSON.stringify(profile, null, 2));
    }

    console.log('📝 Βήμα 2: Δοκιμή select όλων των profiles...');
    
    const { data: allProfiles, error: allError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    console.log('   All profiles result:', allProfiles);
    console.log('   All profiles error:', allError);
    
    if (allError) {
      console.error('❌ All profiles query failed:', allError);
    } else {
      console.log('✅ All profiles query succeeded');
      console.log(`   Found ${allProfiles.length} profiles`);
    }

    console.log('📝 Βήμα 3: Δοκιμή table info...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    console.log('   Table info result:', tableInfo);
    console.log('   Table info error:', tableError);

    console.log('🎉 Δοκιμή απλού query ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα δοκιμής:', err);
  }
}

testSimpleQuery();
