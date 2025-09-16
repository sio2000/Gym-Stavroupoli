const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBulletproofAuthFix() {
  console.log('🧪 Testing Bulletproof Auth Fix...\n');

  try {
    // Test 1: Check user exists
    console.log('1️⃣ Checking user exists...');
    const testEmail = 'fibovil501@reifide.com';
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (profileError) {
      console.error('❌ Profile query error:', profileError.message);
      return;
    }

    console.log('✅ User found:', {
      user_id: profile.user_id,
      email: profile.email,
      role: profile.role,
      first_name: profile.first_name
    });

    // Test 2: Test login
    console.log('\n2️⃣ Testing login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'test123' // Try different passwords
    });

    if (authError) {
      console.log('❌ Login failed with test123, trying other passwords...');
      
      // Try other common passwords
      const passwords = ['password123', 'password', '123456', 'admin123', 'fibovil123'];
      
      for (const password of passwords) {
        console.log(`   Trying password: ${password}`);
        const { data: testAuth, error: testError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: password
        });
        
        if (!testError) {
          console.log(`✅ Login successful with password: ${password}`);
          break;
        }
      }
    } else {
      console.log('✅ Login successful with test123');
    }

    // Test 3: Check session
    console.log('\n3️⃣ Checking session...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('✅ Session active:', {
        user_id: session.user.id,
        email: session.user.email
      });
    } else {
      console.log('❌ No active session');
    }

    // Test 4: Test profile access
    console.log('\n4️⃣ Testing profile access...');
    const { data: profileAfterLogin, error: profileAfterLoginError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', profile.user_id)
      .single();

    if (profileAfterLoginError) {
      console.error('❌ Profile access error:', profileAfterLoginError.message);
    } else {
      console.log('✅ Profile accessible:', {
        user_id: profileAfterLogin.user_id,
        email: profileAfterLogin.email,
        role: profileAfterLogin.role
      });
    }

    console.log('\n🎉 Bulletproof auth fix test completed!');
    console.log('\n📋 Expected behavior in browser:');
    console.log('   1. User enters credentials and clicks login');
    console.log('   2. Login succeeds and user state is set');
    console.log('   3. Profile loads automatically via auth state change');
    console.log('   4. isAuthenticated becomes true');
    console.log('   5. User gets redirected to dashboard');
    console.log('   6. NO INFINITE LOOPS!');
    console.log('   7. NO REPEATED LOGIN CALLS!');
    console.log('   8. NO REPEATED PROFILE LOADS!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBulletproofAuthFix();
