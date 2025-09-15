const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env file not found!');
      console.log('Please create a .env file with:');
      console.log('VITE_SUPABASE_URL=your_supabase_url');
      console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('');
  console.error('Please check your .env file!');
  process.exit(1);
}

console.log('📡 Supabase URL:', supabaseUrl);
console.log('🔑 Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

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
    
    // SQL statements to execute
    const statements = [
      // Create user_referral_points table
      `CREATE TABLE IF NOT EXISTS user_referral_points (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
        points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      )`,
      
      // Create referral_transactions table
      `CREATE TABLE IF NOT EXISTS referral_transactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        referrer_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
        referred_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
        referral_code VARCHAR(20) NOT NULL,
        points_awarded INTEGER NOT NULL DEFAULT 10,
        transaction_type VARCHAR(20) NOT NULL DEFAULT 'referral' CHECK (transaction_type IN ('referral', 'bonus', 'adjustment')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_user_referral_points_user_id ON user_referral_points(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer_id ON referral_transactions(referrer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred_id ON referral_transactions(referred_id)`,
      
      // Enable RLS
      `ALTER TABLE user_referral_points ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY`,
      
      // Create policies for user_referral_points
      `DROP POLICY IF EXISTS "Users can view own referral points" ON user_referral_points`,
      `CREATE POLICY "Users can view own referral points" ON user_referral_points
        FOR SELECT USING (user_id = auth.uid())`,
      
      `DROP POLICY IF EXISTS "Admins can view all referral points" ON user_referral_points`,
      `CREATE POLICY "Admins can view all referral points" ON user_referral_points
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
          )
        )`,
      
      // Create policies for referral_transactions
      `DROP POLICY IF EXISTS "Users can view own referral transactions" ON referral_transactions`,
      `CREATE POLICY "Users can view own referral transactions" ON referral_transactions
        FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid())`,
      
      `DROP POLICY IF EXISTS "Admins can view all referral transactions" ON referral_transactions`,
      `CREATE POLICY "Admins can view all referral transactions" ON referral_transactions
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
          )
        )`,
      
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

          -- Check if referral code exists
          IF v_referrer_id IS NULL THEN
              RETURN QUERY SELECT FALSE, 'Invalid referral code.'::TEXT, 0;
              RETURN;
          END IF;

          -- Prevent self-referral
          IF v_referrer_id = p_referred_user_id THEN
              RETURN QUERY SELECT FALSE, 'Cannot refer yourself.'::TEXT, 0;
              RETURN;
          END IF;

          -- Check if this referral transaction already exists
          IF EXISTS (
              SELECT 1 FROM referral_transactions 
              WHERE referred_id = p_referred_user_id 
              AND referrer_id = v_referrer_id
          ) THEN
              RETURN QUERY SELECT FALSE, 'This user has already been referred by this code.'::TEXT, 0;
              RETURN;
          END IF;

          -- Get referrer profile info
          SELECT first_name, last_name INTO v_referrer_profile
          FROM user_profiles
          WHERE user_id = v_referrer_id;

          -- Add or update points for the referrer
          INSERT INTO user_referral_points (user_id, points)
          VALUES (v_referrer_id, v_points_to_award)
          ON CONFLICT (user_id) 
          DO UPDATE SET 
              points = user_referral_points.points + v_points_to_award,
              updated_at = NOW();

          -- Get the updated points total
          SELECT points INTO v_existing_points
          FROM user_referral_points
          WHERE user_id = v_referrer_id;

          -- Record the transaction
          INSERT INTO referral_transactions (
              referrer_id, 
              referred_id, 
              referral_code, 
              points_awarded, 
              transaction_type
          ) VALUES (
              v_referrer_id, 
              p_referred_user_id, 
              p_referral_code, 
              v_points_to_award, 
              'referral'
          );

          -- Return success
          RETURN QUERY SELECT 
              TRUE, 
              ('Referral points awarded successfully! ' || 
               COALESCE(v_referrer_profile.first_name, '') || ' ' || 
               COALESCE(v_referrer_profile.last_name, '') || 
               ' now has ' || v_existing_points || ' total points.')::TEXT, 
              v_points_to_award;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER`,
      
      // Grant permissions
      `GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role`,
      `GRANT ALL ON user_referral_points TO postgres, anon, authenticated, service_role`,
      `GRANT ALL ON referral_transactions TO postgres, anon, authenticated, service_role`,
      `GRANT EXECUTE ON FUNCTION generate_referral_code() TO postgres, anon, authenticated, service_role`,
      `GRANT EXECUTE ON FUNCTION get_user_referral_points(UUID) TO postgres, anon, authenticated, service_role`,
      `GRANT EXECUTE ON FUNCTION get_user_referral_code(UUID) TO postgres, anon, authenticated, service_role`,
      `GRANT EXECUTE ON FUNCTION process_referral_signup(UUID, VARCHAR) TO postgres, anon, authenticated, service_role`
    ];
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('🎉 Referral System setup completed!');
    console.log('');
    console.log('📋 What was created:');
    console.log('   • user_referral_points table - stores user referral points');
    console.log('   • referral_transactions table - tracks all referral transactions');
    console.log('   • Database functions for referral processing');
    console.log('   • RLS policies for security');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Test the referral system in your app');
    console.log('   2. Verify referral codes are generated for existing users');
    console.log('   3. Test referral signup flow');
    
  } catch (error) {
    console.error('💥 Fatal error during setup:', error);
    process.exit(1);
  }
}

// Run the setup
applyReferralSystem();
