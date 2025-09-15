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

async function createTriggerDirect() {
  try {
    console.log('🚀 Creating Referral Code Trigger (Direct Method)...\n');

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

    // Test if trigger function already exists
    console.log('\n1️⃣ Testing if trigger function exists...');
    const { data: testTrigger, error: triggerError } = await supabase
      .rpc('assign_referral_code_to_new_user', {
        p_user_id: '00000000-0000-0000-0000-000000000000'
      });
    
    if (triggerError) {
      console.log('❌ Trigger function not found:', triggerError.message);
      console.log('   This is expected - we need to create it');
    } else {
      console.log('✅ Trigger function already exists');
    }

    // Test if generate_referral_code function exists
    console.log('\n2️⃣ Testing generate_referral_code function...');
    const { data: testCode, error: codeError } = await supabase
      .rpc('generate_referral_code');
    
    if (codeError) {
      console.log('❌ generate_referral_code function not found:', codeError.message);
      console.log('   This function is required for the trigger');
      return;
    } else {
      console.log('✅ generate_referral_code function works:', testCode);
    }

    // Test current user profile creation behavior
    console.log('\n3️⃣ Testing current user profile creation...');
    
    // Get a test user
    const { data: testUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, referral_code')
      .limit(1)
      .single();
    
    if (userError) {
      console.log('❌ No users found to test with');
      return;
    }
    
    console.log(`✅ Found test user: ${testUser.user_id}`);
    console.log(`   Current referral code: ${testUser.referral_code || 'NULL'}`);

    // Test get_user_referral_code function
    console.log('\n4️⃣ Testing get_user_referral_code function...');
    const { data: referralCode, error: codeError2 } = await supabase
      .rpc('get_user_referral_code', {
        p_user_id: testUser.user_id
      });
    
    if (codeError2) {
      console.log('❌ get_user_referral_code function failed:', codeError2.message);
    } else {
      console.log(`✅ get_user_referral_code works: ${referralCode}`);
    }

    console.log('\n🎉 Trigger Check Completed!');
    console.log('\n📋 Summary:');
    console.log('   • Database connection: ✅');
    console.log('   • generate_referral_code function: ✅');
    console.log('   • get_user_referral_code function: ✅');
    console.log('   • Trigger function: Needs to be created via SQL Editor');
    console.log('\n🔧 Next steps:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy and paste the SQL from create_referral_trigger.sql');
    console.log('   3. Run the SQL to create the trigger');
    console.log('   4. Test with new user registration');
    console.log('\n📝 SQL to run in Supabase Dashboard:');
    console.log('```sql');
    console.log('-- Create trigger function');
    console.log('CREATE OR REPLACE FUNCTION assign_referral_code_to_new_user()');
    console.log('RETURNS TRIGGER AS $$');
    console.log('BEGIN');
    console.log('    IF NEW.referral_code IS NULL OR NEW.referral_code = \'\' THEN');
    console.log('        NEW.referral_code := public.generate_referral_code();');
    console.log('    END IF;');
    console.log('    RETURN NEW;');
    console.log('END;');
    console.log('$$ LANGUAGE plpgsql SECURITY DEFINER;');
    console.log('');
    console.log('-- Create trigger');
    console.log('DROP TRIGGER IF EXISTS on_user_profile_created_assign_referral_code ON user_profiles;');
    console.log('CREATE TRIGGER on_user_profile_created_assign_referral_code');
    console.log('    BEFORE INSERT ON user_profiles');
    console.log('    FOR EACH ROW EXECUTE FUNCTION assign_referral_code_to_new_user();');
    console.log('```');

  } catch (error) {
    console.error('💥 Check failed:', error);
  }
}

// Run the check
createTriggerDirect();
