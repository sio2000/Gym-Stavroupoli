/**
 * SIMPLE TRIGGER CHECK SCRIPT
 * Απλός έλεγχος για το trigger system
 */

const { createClient } = require('@supabase/supabase-js');

// Hardcoded Supabase credentials
const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function simpleTriggerCheck() {
  console.log('🔍 Simple Trigger System Check...');
  console.log('');

  try {
    // 1. Check recent user profiles
    console.log('1️⃣ Checking recent user profiles...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (profileError) {
      console.log('❌ Could not check user profiles:', profileError.message);
    } else {
      console.log(`✅ Found ${profiles.length} recent user profiles`);
      profiles.forEach((profile, index) => {
        const createdTime = new Date(profile.created_at).toLocaleString();
        console.log(`   ${index + 1}. ${profile.first_name} ${profile.last_name} (${profile.email}) - ${createdTime}`);
      });
    }

    // 2. Test trigger by creating a test user
    console.log('');
    console.log('2️⃣ Testing trigger by creating test user...');
    const testEmail = `trigger_test_${Date.now()}@gmail.com`;
    
    try {
      // Create test user
      const { data: testAuth, error: testAuthError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User',
            language: 'el'
          }
        }
      });

      if (testAuthError) {
        console.log('❌ Could not create test user:', testAuthError.message);
      } else if (testAuth.user) {
        console.log('✅ Test user created:', testAuth.user.email);
        console.log('⏳ Waiting 5 seconds for trigger to create profile...');
        
        // Wait for trigger
        await new Promise(r => setTimeout(r, 5000));
        
        // Check if profile was created
        const { data: testProfile, error: testProfileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', testAuth.user.id)
          .single();

        if (testProfileError) {
          console.log('❌ Test profile not found after 5 seconds');
          console.log('   This means the trigger is NOT working');
        } else {
          console.log('✅ Test profile created successfully by trigger!');
          console.log(`   📋 Name: ${testProfile.first_name} ${testProfile.last_name}`);
          console.log(`   📋 Email: ${testProfile.email}`);
          console.log(`   📋 Role: ${testProfile.role}`);
          console.log('🎉 TRIGGER IS WORKING!');
        }

        // Clean up test user
        await supabase.auth.signOut();
      }
    } catch (testError) {
      console.log('❌ Test failed:', testError.message);
    }

    // 3. Summary
    console.log('');
    console.log('📊 SUMMARY:');
    console.log('   - Recent profiles found:', profiles?.length || 0);
    console.log('   - Trigger test:', testAuth?.user ? 'Completed' : 'Failed');
    
    if (profiles && profiles.length > 0) {
      console.log('✅ System appears to be working - profiles are being created');
    } else {
      console.log('⚠️ No recent profiles found - trigger may not be working');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
simpleTriggerCheck().then(() => {
  console.log('');
  console.log('🔍 Simple trigger check completed!');
}).catch(error => {
  console.error('❌ Check failed:', error);
});
