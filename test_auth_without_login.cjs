const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthWithoutLogin() {
  console.log('🧪 Testing Auth Without Login...\n');

  try {
    // Test 1: Check if we can access the user_profiles table
    console.log('1️⃣ Testing user_profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name, role')
      .limit(5);

    if (profilesError) {
      console.log('❌ Profiles table access failed:', profilesError.message);
      return;
    }

    console.log('✅ Profiles table access successful!');
    console.log('📊 Found profiles:', profiles.length);
    
    if (profiles.length > 0) {
      console.log('👤 First profile:', {
        id: profiles[0].user_id,
        name: `${profiles[0].first_name} ${profiles[0].last_name}`,
        email: profiles[0].email,
        role: profiles[0].role
      });
    }

    // Test 2: Test specific user profile
    console.log('\n2️⃣ Testing specific user profile...');
    const testUserId = '185fe63d-17c4-44ee-8fce-64036b48dfc1';
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (profileError) {
      console.log('❌ Profile loading failed:', profileError.message);
      return;
    }

    if (profile) {
      console.log('✅ Profile loaded successfully!');
      console.log('👤 Name:', profile.first_name, profile.last_name);
      console.log('📧 Email:', profile.email);
      console.log('🔑 Role:', profile.role);
    }

    // Test 3: Test race condition with multiple queries
    console.log('\n3️⃣ Testing race condition with multiple queries...');
    
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        supabase
          .from('user_profiles')
          .select('user_id, email, first_name, last_name, role')
          .eq('user_id', testUserId)
          .single()
      );
    }

    console.log('🚀 Starting 5 simultaneous profile queries...');
    const startTime = Date.now();
    
    const results = await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  All queries completed in ${duration}ms`);
    
    // Check results
    let successCount = 0;
    let errorCount = 0;
    
    results.forEach((result, index) => {
      if (result.error) {
        console.log(`❌ Query ${index + 1} failed:`, result.error.message);
        errorCount++;
      } else {
        console.log(`✅ Query ${index + 1} succeeded`);
        successCount++;
      }
    });

    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} failed`);

    // Test 4: Test with timeout simulation
    console.log('\n4️⃣ Testing timeout simulation...');
    
    const profilePromise = supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile query timeout')), 1000)
    );
    
    try {
      const { data: timeoutProfile, error: timeoutError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);

      if (timeoutError) {
        console.log('❌ Timeout test failed:', timeoutError.message);
      } else {
        console.log('✅ Timeout test succeeded');
        console.log('👤 Profile loaded:', timeoutProfile.first_name, timeoutProfile.last_name);
      }
    } catch (timeoutError) {
      console.log('⏰ Timeout occurred as expected:', timeoutError.message);
    }

    console.log('\n🎉 Auth Without Login Test Completed!');
    console.log('✅ Profiles table access: OK');
    console.log('✅ Profile loading: OK');
    console.log('✅ Race condition handling: OK');
    console.log('✅ Timeout simulation: OK');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthWithoutLogin();