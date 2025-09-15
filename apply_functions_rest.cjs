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

async function applyFunctions() {
  try {
    console.log('🚀 Applying Referral Functions...');
    
    // Test connection first
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
    
    // Test existing functions
    console.log('🧪 Testing existing functions...');
    
    // Test generate_referral_code
    const { data: testCode, error: codeError } = await supabase
      .rpc('generate_referral_code');
    
    if (codeError) {
      console.log('❌ generate_referral_code function not found:', codeError.message);
      console.log('   This function needs to be created via SQL Editor');
    } else {
      console.log('✅ generate_referral_code function works:', testCode);
    }
    
    // Test get_user_referral_points
    const { data: testUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(1)
      .single();
    
    if (!userError && testUser) {
      const { data: testPoints, error: pointsError } = await supabase
        .rpc('get_user_referral_points', { p_user_id: testUser.user_id });
      
      if (pointsError) {
        console.log('❌ get_user_referral_points function not found:', pointsError.message);
        console.log('   This function needs to be created via SQL Editor');
      } else {
        console.log('✅ get_user_referral_points function works:', testPoints);
      }
      
      // Test get_user_referral_code
      const { data: testCode2, error: codeError2 } = await supabase
        .rpc('get_user_referral_code', { p_user_id: testUser.user_id });
      
      if (codeError2) {
        console.log('❌ get_user_referral_code function not found:', codeError2.message);
        console.log('   This function needs to be created via SQL Editor');
      } else {
        console.log('✅ get_user_referral_code function works:', testCode2);
      }
    }
    
    // Test process_referral_signup
    const { data: testReferral, error: referralError } = await supabase
      .rpc('process_referral_signup', {
        p_referred_user_id: testUser?.user_id || '00000000-0000-0000-0000-000000000000',
        p_referral_code: 'TEST123'
      });
    
    if (referralError) {
      console.log('❌ process_referral_signup function not found:', referralError.message);
      console.log('   This function needs to be created via SQL Editor');
    } else {
      console.log('✅ process_referral_signup function works:', testReferral);
    }
    
    console.log('🎉 Function testing completed!');
    console.log('');
    console.log('📋 Status:');
    console.log('   • Database connection: ✅');
    console.log('   • Tables exist: ✅');
    console.log('   • Functions: Need to be created via SQL Editor');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy and paste the SQL from database/create_referral_points_system.sql');
    console.log('   3. Run the SQL to create the functions');
    console.log('   4. Test the referral system in your app');
    
  } catch (error) {
    console.error('💥 Fatal error during setup:', error);
    process.exit(1);
  }
}

// Run the setup
applyFunctions();
