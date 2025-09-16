const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimplifiedAuth() {
  try {
    console.log('🧪 Δοκιμή απλοποιημένου auth...');
    
    const userId = '919ae161-6aae-4c3c-be0f-bb1a6e14429b';
    
    console.log('📝 Βήμα 1: Δοκιμή query με timeout...');
    console.log(`   User ID: ${userId}`);
    
    const queryPromise = supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 3 seconds')), 3000)
    );

    console.log('   Καλώντας query με timeout...');
    const startTime = Date.now();
    
    try {
      const { data: profile, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`   Query completed in ${duration}ms`);
      console.log('   Result:', profile);
      console.log('   Error:', error);
      
      if (error) {
        console.error('❌ Query failed:', error);
        console.log('   Error code:', error.code);
        console.log('   Error message:', error.message);
        
        if (error.code === 'PGRST116') {
          console.log('   No profile found, creating one...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: userId,
              email: 'diyisep787@ekuali.com',
              first_name: 'User',
              last_name: '',
              phone: null,
              language: 'el',
              role: 'user',
              referral_code: `REF${userId.substring(0, 8)}`
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Profile creation failed:', createError);
          } else {
            console.log('✅ Profile created successfully:', newProfile);
          }
        }
      } else {
        console.log('✅ Query succeeded');
        console.log('   Profile data:', JSON.stringify(profile, null, 2));
      }
    } catch (timeoutError) {
      console.error('❌ Query timed out:', timeoutError.message);
    }

    console.log('🎉 Δοκιμή απλοποιημένου auth ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα δοκιμής:', err);
  }
}

testSimplifiedAuth();
