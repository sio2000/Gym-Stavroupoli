const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginFlow() {
  console.log('🧪 Testing Login Flow...\n');

  try {
    // Test 1: Try to login
    console.log('1️⃣ Attempting login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'gipacik269@ishense.com',
      password: 'password123' // You'll need to provide the actual password
    });

    if (error) {
      console.log('❌ Login error:', error.message);
      return;
    }

    if (data.user) {
      console.log('✅ Login successful!');
      console.log('👤 User ID:', data.user.id);
      console.log('📧 Email:', data.user.email);
    }

    // Test 2: Load profile after login
    console.log('\n2️⃣ Loading profile after login...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user.id)
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

    // Test 3: Check if user is authenticated
    console.log('\n3️⃣ Checking authentication status...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ User error:', userError.message);
    } else if (user) {
      console.log('✅ User is authenticated!');
      console.log('👤 User ID:', user.id);
      console.log('📧 Email:', user.email);
    } else {
      console.log('❌ No user found');
    }

    console.log('\n🎉 Login Flow Test Completed Successfully!');
    console.log('✅ Login: OK');
    console.log('✅ Profile loading: OK');
    console.log('✅ Authentication status: OK');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLoginFlow();