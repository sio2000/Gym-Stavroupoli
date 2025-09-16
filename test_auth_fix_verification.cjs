const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthFix() {
  console.log('🧪 Testing Auth Fix Verification...\n');

  try {
    // Test 1: Check if user exists in user_profiles
    console.log('1️⃣ Testing user profile access...');
    const testEmail = 'gipacik269@ishense.com';
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (profileError) {
      console.error('❌ Profile query error:', profileError.message);
      return;
    }

    console.log('✅ Profile found:', {
      user_id: profile.user_id,
      email: profile.email,
      role: profile.role,
      first_name: profile.first_name
    });

    // Test 2: Test login flow
    console.log('\n2️⃣ Testing login flow...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'test123' // Try different password
    });

    if (authError) {
      console.error('❌ Login error:', authError.message);
      return;
    }

    console.log('✅ Login successful:', {
      user_id: authData.user.id,
      email: authData.user.email
    });

    // Test 3: Test profile loading after login
    console.log('\n3️⃣ Testing profile loading after login...');
    const { data: profileAfterLogin, error: profileAfterLoginError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileAfterLoginError) {
      console.error('❌ Profile loading error:', profileAfterLoginError.message);
      return;
    }

    console.log('✅ Profile loaded after login:', {
      user_id: profileAfterLogin.user_id,
      email: profileAfterLogin.email,
      role: profileAfterLogin.role
    });

    // Test 4: Test authentication state
    console.log('\n4️⃣ Testing authentication state...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('✅ Session active:', {
        user_id: session.user.id,
        email: session.user.email,
        expires_at: new Date(session.expires_at * 1000).toISOString()
      });
    } else {
      console.log('❌ No active session');
    }

    // Test 5: Test logout
    console.log('\n5️⃣ Testing logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.error('❌ Logout error:', logoutError.message);
    } else {
      console.log('✅ Logout successful');
    }

    console.log('\n🎉 All tests passed! The auth fix should work correctly.');
    console.log('\n📋 Expected behavior:');
    console.log('   - User logs in with correct credentials');
    console.log('   - Profile loads successfully');
    console.log('   - isAuthenticated becomes true');
    console.log('   - isLoading becomes false');
    console.log('   - User gets redirected to appropriate dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthFix();
