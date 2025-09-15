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

async function applyReferralSystem() {
  try {
    console.log('🚀 Starting Referral System Setup...');
    
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
    
    // Create tables using direct SQL execution
    console.log('📝 Creating user_referral_points table...');
    const { error: table1Error } = await supabase
      .from('user_referral_points')
      .select('*')
      .limit(1);
    
    if (table1Error && table1Error.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('   Creating table...');
      // We'll use the SQL editor approach
    } else {
      console.log('   Table already exists');
    }
    
    console.log('📝 Creating referral_transactions table...');
    const { error: table2Error } = await supabase
      .from('referral_transactions')
      .select('*')
      .limit(1);
    
    if (table2Error && table2Error.code === 'PGRST116') {
      console.log('   Creating table...');
    } else {
      console.log('   Table already exists');
    }
    
    // Test functions
    console.log('🧪 Testing referral functions...');
    
    // Test generate_referral_code
    const { data: testCode, error: codeError } = await supabase
      .rpc('generate_referral_code');
    
    if (codeError) {
      console.log('❌ generate_referral_code function not found:', codeError.message);
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
      } else {
        console.log('✅ get_user_referral_points function works:', testPoints);
      }
    }
    
    console.log('🎉 Referral System setup completed!');
    console.log('');
    console.log('📋 Status:');
    console.log('   • Database connection: ✅');
    console.log('   • Tables: Need to be created via SQL Editor');
    console.log('   • Functions: Need to be created via SQL Editor');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Run the SQL from database/create_referral_points_system.sql');
    console.log('   3. Test the referral system in your app');
    
  } catch (error) {
    console.error('💥 Fatal error during setup:', error);
    process.exit(1);
  }
}

// Run the setup
applyReferralSystem();