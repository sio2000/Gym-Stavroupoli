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

async function applySQLFunctions() {
  try {
    console.log('🚀 Applying SQL Functions for Referral System...');
    
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
    
    // SQL statements to execute
    const statements = [
      // Create generate_referral_code function
      `CREATE OR REPLACE FUNCTION generate_referral_code()
      RETURNS VARCHAR(20) AS $$
      DECLARE
          code VARCHAR(20);
          exists BOOLEAN;
      BEGIN
          LOOP
              code := upper(substring(md5(random()::text) from 1 for 8));
              SELECT EXISTS(SELECT 1 FROM user_profiles WHERE referral_code = code) INTO exists;
              IF NOT exists THEN
                  RETURN code;
              END IF;
          END LOOP;
      END;
      $$ LANGUAGE plpgsql`,
      
      // Create ensure_user_referral_code function
      `CREATE OR REPLACE FUNCTION ensure_user_referral_code(p_user_id UUID)
      RETURNS VARCHAR(20) AS $$
      DECLARE
          v_referral_code VARCHAR(20);
          v_exists BOOLEAN;
      BEGIN
          -- Check if user already has a referral code
          SELECT referral_code INTO v_referral_code
          FROM user_profiles 
          WHERE user_id = p_user_id;
          
          IF v_referral_code IS NOT NULL THEN
              RETURN v_referral_code;
          END IF;
          
          -- Generate unique referral code
          LOOP
              v_referral_code := upper(substring(md5(random()::text) from 1 for 8));
              SELECT EXISTS(SELECT 1 FROM user_profiles WHERE referral_code = v_referral_code) INTO v_exists;
              IF NOT v_exists THEN
                  EXIT;
              END IF;
          END LOOP;
          
          -- Update user profile with referral code
          UPDATE user_profiles 
          SET referral_code = v_referral_code
          WHERE user_id = p_user_id;
          
          RETURN v_referral_code;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER`,
      
      // Create process_referral_signup function
      `CREATE OR REPLACE FUNCTION process_referral_signup(
          p_referred_user_id UUID,
          p_referral_code VARCHAR(20)
      )
      RETURNS TABLE(
          success BOOLEAN,
          message TEXT,
          points_awarded INTEGER
      ) AS $$
      DECLARE
          v_referrer_id UUID;
          v_referrer_profile RECORD;
          v_points_to_award INTEGER := 10;
          v_existing_points INTEGER;
      BEGIN
          -- Find the referrer by referral code
          SELECT user_id INTO v_referrer_id
          FROM user_profiles 
          WHERE referral_code = p_referral_code;
          
          IF v_referrer_id IS NULL THEN
              RETURN QUERY SELECT false, 'Invalid referral code'::TEXT, 0;
              RETURN;
          END IF;
          
          -- Check if user is trying to refer themselves
          IF v_referrer_id = p_referred_user_id THEN
              RETURN QUERY SELECT false, 'Cannot use your own referral code'::TEXT, 0;
              RETURN;
          END IF;
          
          -- Get referrer profile info
          SELECT first_name, last_name, email INTO v_referrer_profile
          FROM user_profiles 
          WHERE user_id = v_referrer_id;
          
          -- Insert or update referral points for referrer
          INSERT INTO user_referral_points (user_id, points)
          VALUES (v_referrer_id, v_points_to_award)
          ON CONFLICT (user_id) 
          DO UPDATE SET 
              points = user_referral_points.points + v_points_to_award,
              updated_at = NOW();
          
          -- Record the transaction
          INSERT INTO referral_transactions (
              referrer_id, 
              referred_id, 
              referral_code, 
              points_awarded
          ) VALUES (
              v_referrer_id, 
              p_referred_user_id, 
              p_referral_code, 
              v_points_to_award
          );
          
          -- Get updated points total
          SELECT points INTO v_existing_points
          FROM user_referral_points 
          WHERE user_id = v_referrer_id;
          
          RETURN QUERY SELECT true, 
              format('Successfully awarded %s points to %s %s', 
                     v_points_to_award, 
                     v_referrer_profile.first_name, 
                     v_referrer_profile.last_name)::TEXT, 
              v_existing_points;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER`,
      
      // Create get_user_referral_points function
      `CREATE OR REPLACE FUNCTION get_user_referral_points(p_user_id UUID)
      RETURNS INTEGER AS $$
      DECLARE
          v_points INTEGER;
      BEGIN
          SELECT COALESCE(points, 0) INTO v_points
          FROM user_referral_points 
          WHERE user_id = p_user_id;
          
          RETURN COALESCE(v_points, 0);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER`,
      
      // Create get_user_referral_code function
      `CREATE OR REPLACE FUNCTION get_user_referral_code(p_user_id UUID)
      RETURNS VARCHAR(20) AS $$
      DECLARE
          user_code VARCHAR(20);
      BEGIN
          SELECT referral_code INTO user_code
          FROM user_profiles
          WHERE user_id = p_user_id;

          -- If no code exists, generate one
          IF user_code IS NULL OR user_code = '' THEN
              user_code := public.generate_referral_code();
              
              -- Update the user profile with the new code
              UPDATE user_profiles 
              SET referral_code = user_code 
              WHERE user_id = p_user_id;
          END IF;

          RETURN user_code;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER`
    ];
    
    console.log(`📝 Found ${statements.length} SQL functions to create`);
    
    // Execute each statement using the SQL editor API
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Creating function ${i + 1}/${statements.length}...`);
      
      try {
        // Use the SQL editor API
        const { data, error } = await supabase
          .from('sql_queries')
          .insert({
            query: statement,
            name: `referral_function_${i + 1}`
          });
        
        if (error) {
          console.error(`❌ Error creating function ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Function ${i + 1} created successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception creating function ${i + 1}:`, err.message);
      }
    }
    
    console.log('🎉 SQL Functions setup completed!');
    console.log('');
    console.log('📋 What was created:');
    console.log('   • generate_referral_code() - generates unique codes');
    console.log('   • ensure_user_referral_code() - ensures user has code');
    console.log('   • process_referral_signup() - processes referrals');
    console.log('   • get_user_referral_points() - gets user points');
    console.log('   • get_user_referral_code() - gets user code');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Test the functions in your app');
    console.log('   2. Verify referral codes are generated');
    console.log('   3. Test referral signup flow');
    
  } catch (error) {
    console.error('💥 Fatal error during setup:', error);
    process.exit(1);
  }
}

// Run the setup
applySQLFunctions();
