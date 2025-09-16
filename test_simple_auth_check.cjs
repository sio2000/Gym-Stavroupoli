const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleAuthCheck() {
  console.log('🧪 Simple Auth Check...\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, email, role, first_name')
      .limit(5);

    if (profilesError) {
      console.error('❌ Database connection error:', profilesError.message);
      return;
    }

    console.log('✅ Database connected successfully');
    console.log('📊 Found profiles:', profiles.length);
    
    if (profiles.length > 0) {
      console.log('👤 Sample profile:', {
        user_id: profiles[0].user_id,
        email: profiles[0].email,
        role: profiles[0].role,
        first_name: profiles[0].first_name
      });
    }

    // Test 2: Check specific user
    console.log('\n2️⃣ Testing specific user...');
    const testEmail = 'gipacik269@ishense.com';
    
    const { data: specificProfile, error: specificError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (specificError) {
      console.error('❌ Specific user error:', specificError.message);
    } else {
      console.log('✅ Specific user found:', {
        user_id: specificProfile.user_id,
        email: specificProfile.email,
        role: specificProfile.role,
        first_name: specificProfile.first_name
      });
    }

    console.log('\n🎉 Database and user checks completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start development server: npm run dev');
    console.log('   2. Open browser: http://localhost:5173');
    console.log('   3. Try logging in with the user credentials');
    console.log('   4. Check if redirect to dashboard works');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleAuthCheck();
