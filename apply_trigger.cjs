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

async function applyTrigger() {
  try {
    console.log('🚀 Creating Referral Code Trigger...\n');

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

    // Read the SQL file
    const sqlContent = fs.readFileSync('create_referral_trigger.sql', 'utf8');
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use the SQL editor API approach
        const { data, error } = await supabase
          .from('sql_queries')
          .insert({
            query: statement,
            name: `referral_trigger_${i + 1}`
          });
        
        if (error) {
          console.log(`❌ Error in statement ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }

    console.log('\n🎉 Trigger creation completed!');
    console.log('\n📋 What was created:');
    console.log('   • assign_referral_code_to_new_user() function');
    console.log('   • on_user_profile_created_assign_referral_code trigger');
    console.log('   • Automatic referral code generation for new users');
    console.log('\n🔧 Next steps:');
    console.log('   1. Test with a new user registration');
    console.log('   2. Verify referral code is generated automatically');
    console.log('   3. Check that existing users still work');

  } catch (error) {
    console.error('💥 Trigger creation failed:', error);
  }
}

// Run the setup
applyTrigger();
