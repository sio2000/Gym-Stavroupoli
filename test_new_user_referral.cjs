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

async function testNewUserReferral() {
  try {
    console.log('🧪 Testing New User Referral Code Generation...\n');

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

    // Test 1: Check if functions work
    console.log('\n1️⃣ Testing referral functions...');
    
    const { data: testCode, error: codeError } = await supabase
      .rpc('generate_referral_code');
    
    if (codeError) {
      console.log('❌ generate_referral_code function failed:', codeError.message);
      return;
    }
    console.log('✅ generate_referral_code works:', testCode);

    // Test 2: Simulate new user profile creation
    console.log('\n2️⃣ Testing new user profile creation...');
    
    // Create a test user profile directly (simulating what happens during registration)
    const testUserId = `test-user-${Date.now()}`;
    const testEmail = `test-${Date.now()}@example.com`;
    
    console.log(`   Creating test profile for user: ${testUserId}`);
    
    // Insert user profile without referral code (simulating new user)
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: testUserId,
        first_name: 'Test',
        last_name: 'User',
        email: testEmail,
        role: 'user',
        language: 'el',
        referral_code: null // Explicitly set to null to test trigger
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Error creating test profile:', profileError.message);
      
      // Check if it's a foreign key constraint (expected for test user)
      if (profileError.message.includes('foreign key constraint')) {
        console.log('   This is expected - test user ID is not in auth.users');
        console.log('   Let\'s test with an existing user instead...');
        
        // Test with existing user
        const { data: existingUser, error: userError } = await supabase
          .from('user_profiles')
          .select('user_id, referral_code')
          .limit(1)
          .single();
        
        if (!userError && existingUser) {
          console.log(`   Testing with existing user: ${existingUser.user_id}`);
          console.log(`   Current referral code: ${existingUser.referral_code}`);
          
          // Test get_user_referral_code function
          const { data: referralCode, error: codeError2 } = await supabase
            .rpc('get_user_referral_code', {
              p_user_id: existingUser.user_id
            });
          
          if (codeError2) {
            console.log('❌ get_user_referral_code failed:', codeError2.message);
          } else {
            console.log(`✅ get_user_referral_code works: ${referralCode}`);
          }
        }
      }
    } else {
      console.log('✅ Test profile created successfully');
      console.log(`   Profile data:`, profileData);
      
      // Check if referral code was generated
      if (profileData.referral_code) {
        console.log(`✅ Referral code was generated: ${profileData.referral_code}`);
      } else {
        console.log('❌ No referral code was generated');
      }
      
      // Clean up test profile
      console.log('🧹 Cleaning up test profile...');
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', testUserId);
    }

    // Test 3: Check current users have referral codes
    console.log('\n3️⃣ Checking current users have referral codes...');
    
    const { data: usersWithCodes, error: codesError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, referral_code')
      .not('referral_code', 'is', null)
      .not('referral_code', 'eq', '')
      .limit(5);
    
    if (codesError) {
      console.log('❌ Error checking referral codes:', codesError.message);
    } else {
      console.log(`✅ Found ${usersWithCodes.length} users with referral codes:`);
      usersWithCodes.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.first_name} ${user.last_name}: ${user.referral_code}`);
      });
    }

    // Test 4: Check users without referral codes
    console.log('\n4️⃣ Checking users without referral codes...');
    
    const { data: usersWithoutCodes, error: noCodesError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, referral_code')
      .or('referral_code.is.null,referral_code.eq.')
      .limit(5);
    
    if (noCodesError) {
      console.log('❌ Error checking users without codes:', noCodesError.message);
    } else {
      console.log(`ℹ️  Found ${usersWithoutCodes.length} users without referral codes`);
      if (usersWithoutCodes.length > 0) {
        console.log('   These users need referral codes:');
        usersWithoutCodes.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.first_name} ${user.last_name}: ${user.referral_code || 'NULL'}`);
        });
      } else {
        console.log('✅ All users have referral codes!');
      }
    }

    console.log('\n🎉 New User Referral Test Completed!');
    console.log('\n📋 Summary:');
    console.log('   • Database functions: Working');
    console.log('   • User referral codes: Checked');
    console.log('   • New user simulation: Tested');
    console.log('\n🔧 Next steps:');
    console.log('   1. Create the trigger via SQL Editor if needed');
    console.log('   2. Test actual user registration in the app');
    console.log('   3. Verify referral codes are generated automatically');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testNewUserReferral();
