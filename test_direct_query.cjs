const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectQuery() {
  try {
    console.log('🧪 Δοκιμή direct query αντί για RPC...');
    
    const userId = '2452f158-440a-449c-9332-2e319a1201bb';
    
    console.log('📝 Βήμα 1: Δοκιμή direct query...');
    console.log(`   User ID: ${userId}`);
    
    // Δοκιμή με timeout
    const profilePromise = supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
    );
    
    console.log('   Καλώντας direct query...');
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const { data: profile, error } = result;
      
      console.log(`   Query completed in ${duration}ms`);
      console.log('   Result:', profile);
      console.log('   Error:', error);
      
      if (error) {
        console.error('❌ Direct query failed:', error);
      } else {
        console.log('✅ Direct query succeeded');
        console.log('   Profile data:', JSON.stringify(profile, null, 2));
      }
    } catch (timeoutError) {
      console.error('❌ Direct query timed out:', timeoutError.message);
    }

    console.log('📝 Βήμα 2: Δοκιμή insert...');
    
    const testUserId = 'test-user-' + Date.now();
    const insertPromise = supabase
      .from('user_profiles')
      .insert({
        user_id: testUserId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        phone: '1234567890',
        language: 'el',
        role: 'user',
        referral_code: `REF${testUserId.substring(0, 8)}`
      })
      .select()
      .single();
    
    const insertTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Insert timeout after 5 seconds')), 5000)
    );
    
    console.log('   Καλώντας insert...');
    const insertStartTime = Date.now();
    
    try {
      const insertResult = await Promise.race([
        insertPromise,
        insertTimeoutPromise
      ]);
      
      const insertEndTime = Date.now();
      const insertDuration = insertEndTime - insertStartTime;
      
      const { data: insertData, error: insertError } = insertResult;
      
      console.log(`   Insert completed in ${insertDuration}ms`);
      console.log('   Insert Result:', insertData);
      console.log('   Insert Error:', insertError);
      
      if (insertError) {
        console.error('❌ Insert failed:', insertError);
      } else {
        console.log('✅ Insert succeeded');
      }
    } catch (insertTimeoutError) {
      console.error('❌ Insert timed out:', insertTimeoutError.message);
    }

    console.log('🎉 Δοκιμή direct queries ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα δοκιμής:', err);
  }
}

testDirectQuery();
