const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env file not found!');
      process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
    
    console.log('✅ .env file loaded successfully');
  } catch (error) {
    console.error('❌ Error loading .env file:', error.message);
    process.exit(1);
  }
}

// Load environment variables
loadEnvFile();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTriggers() {
  try {
    console.log('🔍 Checking for referral code triggers...\n');

    // Test connection
    console.log('🔌 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      return;
    }
    console.log('✅ Connection successful!');

    // Check if generate_referral_code function exists
    console.log('\n1️⃣ Checking generate_referral_code function...');
    const { data: testCode, error: codeError } = await supabase
      .rpc('generate_referral_code');
    
    if (codeError) {
      console.log('❌ generate_referral_code function not found:', codeError.message);
      console.log('   This function is required for automatic code generation');
    } else {
      console.log('✅ generate_referral_code function works:', testCode);
    }

    // Check if get_user_referral_code function exists
    console.log('\n2️⃣ Checking get_user_referral_code function...');
    const { data: testUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(1)
      .single();
    
    if (!userError && testUser) {
      const { data: referralCode, error: codeError2 } = await supabase
        .rpc('get_user_referral_code', {
          p_user_id: testUser.user_id
        });
      
      if (codeError2) {
        console.log('❌ get_user_referral_code function not found:', codeError2.message);
      } else {
        console.log('✅ get_user_referral_code function works:', referralCode);
      }
    }

    // Check if there's a trigger on user_profiles
    console.log('\n3️⃣ Checking for triggers on user_profiles table...');
    
    // Try to create a test user to see if trigger works
    const testEmail = `test-trigger-${Date.now()}@example.com`;
    console.log(`   Creating test user: ${testEmail}`);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'Trigger'
        }
      }
    });

    if (authError) {
      console.log('❌ Error creating test user:', authError.message);
    } else if (authData.user) {
      console.log('✅ Test user created successfully');
      
      // Wait a bit for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if profile was created with referral code
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, referral_code')
        .eq('user_id', authData.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Error fetching profile:', profileError.message);
      } else if (profile) {
        console.log(`✅ Profile created with referral code: ${profile.referral_code || 'NULL'}`);
        
        if (profile.referral_code) {
          console.log('✅ Trigger is working - new users get referral codes automatically');
        } else {
          console.log('❌ Trigger is NOT working - new users do not get referral codes');
        }
      }
      
      // Clean up test user
      console.log('🧹 Cleaning up test user...');
      await supabase.auth.admin.deleteUser(authData.user.id);
    }

    console.log('\n🎯 Trigger Check Completed!');
    console.log('\n📋 Summary:');
    console.log('   • Functions: Checked');
    console.log('   • Trigger test: Completed');
    console.log('   • Next steps: Create trigger if missing');

  } catch (error) {
    console.error('💥 Check failed:', error);
  }
}

// Run the check
checkTriggers();
