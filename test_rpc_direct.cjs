const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpcDirect() {
  try {
    console.log('🧪 Δοκιμή RPC function απευθείας...');
    
    const userId = 'cc94fb99-af31-471c-aecd-54aef836e46f';
    
    console.log('📝 Βήμα 1: Δοκιμή get_user_profile_safe...');
    console.log(`   User ID: ${userId}`);
    
    // Δοκιμή με timeout
    const profilePromise = supabase.rpc('get_user_profile_safe', {
      p_user_id: userId
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('RPC timeout after 5 seconds')), 5000)
    );
    
    console.log('   Καλώντας RPC function...');
    const startTime = Date.now();
    
    const result = await Promise.race([
      profilePromise,
      timeoutPromise
    ]);
    const { data: profile, error } = result;
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   RPC call completed in ${duration}ms`);
    console.log('   Result:', profile);
    console.log('   Error:', error);
    
    if (error) {
      console.error('❌ RPC function failed:', error);
    } else {
      console.log('✅ RPC function succeeded');
      console.log('   Profile data:', JSON.stringify(profile, null, 2));
    }

    console.log('📝 Βήμα 2: Δοκιμή create_user_profile_safe...');
    
    const createPromise = supabase.rpc('create_user_profile_safe', {
      p_user_id: userId,
      p_email: 'test@example.com',
      p_first_name: 'Test',
      p_last_name: 'User',
      p_phone: '1234567890',
      p_language: 'el'
    });
    
    const createTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Create RPC timeout after 5 seconds')), 5000)
    );
    
    console.log('   Καλώντας create_user_profile_safe...');
    const createStartTime = Date.now();
    
    const createResult = await Promise.race([
      createPromise,
      createTimeoutPromise
    ]);
    const { data: createData, error: createError } = createResult;
    
    const createEndTime = Date.now();
    const createDuration = createEndTime - createStartTime;
    
    console.log(`   Create RPC call completed in ${createDuration}ms`);
    console.log('   Create Result:', createData);
    console.log('   Create Error:', createError);
    
    if (createError) {
      console.error('❌ Create RPC function failed:', createError);
    } else {
      console.log('✅ Create RPC function succeeded');
    }

    console.log('🎉 Δοκιμή RPC functions ολοκληρώθηκε!');

  } catch (err) {
    console.error('❌ Σφάλμα δοκιμής RPC:', err);
  }
}

testRpcDirect();
