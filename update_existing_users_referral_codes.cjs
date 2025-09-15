const { createClient } = require('@supabase/supabase-js');

// Hardcoded values - replace with your actual values
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjQzNzQ0MCwiZXhwIjoyMDQyMDEzNDQwfQ.YourServiceKeyHere';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateExistingUsers() {
  try {
    console.log('🔄 Updating existing users with referral codes...\n');

    // Get all users without referral codes
    const { data: usersWithoutCodes, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, referral_code')
      .or('referral_code.is.null,referral_code.eq.')
      .limit(100);

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError.message);
      return;
    }

    console.log(`📊 Found ${usersWithoutCodes.length} users without referral codes`);

    if (usersWithoutCodes.length === 0) {
      console.log('✅ All users already have referral codes!');
      return;
    }

    // Update each user with a referral code
    for (let i = 0; i < usersWithoutCodes.length; i++) {
      const user = usersWithoutCodes[i];
      console.log(`\n${i + 1}. Updating user: ${user.first_name} ${user.last_name} (${user.email})`);
      
      try {
        // Generate a unique referral code
        const { data: newCode, error: codeError } = await supabase
          .rpc('generate_referral_code');

        if (codeError) {
          console.log(`   ❌ Error generating code: ${codeError.message}`);
          continue;
        }

        // Update the user with the new code
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ referral_code: newCode })
          .eq('user_id', user.user_id);

        if (updateError) {
          console.log(`   ❌ Error updating user: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated with code: ${newCode}`);
        }

      } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
      }
    }

    console.log('\n🎉 Update completed!');
    console.log('\n📋 Summary:');
    console.log(`   • Processed ${usersWithoutCodes.length} users`);
    console.log('   • All users should now have referral codes');
    console.log('   • Test the app to verify codes are working');

  } catch (error) {
    console.error('💥 Update failed:', error);
  }
}

// Run the update
updateExistingUsers();
