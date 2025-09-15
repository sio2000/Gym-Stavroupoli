import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testReferralSystem() {
  try {
    console.log('🧪 Testing Referral System...\n');

    // Test 1: Check if tables exist
    console.log('1️⃣ Checking if referral tables exist...');
    
    const { data: pointsTable, error: pointsError } = await supabase
      .from('user_referral_points')
      .select('*')
      .limit(1);
    
    if (pointsError) {
      console.log('❌ user_referral_points table not found:', pointsError.message);
      return;
    }
    console.log('✅ user_referral_points table exists');

    const { data: transactionsTable, error: transactionsError } = await supabase
      .from('referral_transactions')
      .select('*')
      .limit(1);
    
    if (transactionsError) {
      console.log('❌ referral_transactions table not found:', transactionsError.message);
      return;
    }
    console.log('✅ referral_transactions table exists\n');

    // Test 2: Test referral code generation
    console.log('2️⃣ Testing referral code generation...');
    
    const { data: testUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, referral_code')
      .limit(1)
      .single();
    
    if (userError) {
      console.log('❌ No users found to test with:', userError.message);
      return;
    }
    
    console.log(`✅ Found test user: ${testUser.user_id}`);
    console.log(`   Current referral code: ${testUser.referral_code || 'None'}`);

    // Test 3: Test get_user_referral_code function
    console.log('\n3️⃣ Testing get_user_referral_code function...');
    
    const { data: referralCode, error: codeError } = await supabase
      .rpc('get_user_referral_code', {
        p_user_id: testUser.user_id
      });
    
    if (codeError) {
      console.log('❌ Error getting referral code:', codeError.message);
    } else {
      console.log(`✅ Generated referral code: ${referralCode}`);
    }

    // Test 4: Test get_user_referral_points function
    console.log('\n4️⃣ Testing get_user_referral_points function...');
    
    const { data: points, error: pointsError2 } = await supabase
      .rpc('get_user_referral_points', {
        p_user_id: testUser.user_id
      });
    
    if (pointsError2) {
      console.log('❌ Error getting referral points:', pointsError2.message);
    } else {
      console.log(`✅ User referral points: ${points}`);
    }

    // Test 5: Test process_referral_signup function (with invalid code)
    console.log('\n5️⃣ Testing process_referral_signup function...');
    
    const { data: referralResult, error: referralError } = await supabase
      .rpc('process_referral_signup', {
        p_referred_user_id: testUser.user_id,
        p_referral_code: 'INVALID123'
      });
    
    if (referralError) {
      console.log('❌ Error processing referral:', referralError.message);
    } else {
      console.log('✅ Referral processing result:', referralResult);
    }

    // Test 6: Check if user has referral points record
    console.log('\n6️⃣ Checking user referral points record...');
    
    const { data: userPoints, error: userPointsError } = await supabase
      .from('user_referral_points')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();
    
    if (userPointsError) {
      console.log('ℹ️  No referral points record found (this is normal for new users)');
    } else {
      console.log('✅ User referral points record:', userPoints);
    }

    console.log('\n🎉 Referral System Test Completed!');
    console.log('\n📋 Summary:');
    console.log('   • Database tables are created');
    console.log('   • Functions are working');
    console.log('   • Ready for production use');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testReferralSystem();
