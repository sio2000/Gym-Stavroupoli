const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  try {
    console.log('🔧 Applying authentication fix for unknown users...');
    
    // Step 1: First, let's check current profiles with issues
    console.log('📝 Step 1: Checking current profiles with unknown data...');
    const { data: problemProfiles, error: checkError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        first_name,
        last_name,
        created_at
      `)
      .or('email.eq.unknown@example.com,first_name.eq.User,last_name.eq.')
      .limit(10);

    if (checkError) {
      console.error('❌ Error checking profiles:', checkError);
    } else {
      console.log('🔍 Found profiles with issues:');
      console.table(problemProfiles);
    }

    // Step 2: Try to update profiles using direct table operations
    console.log('📝 Step 2: Attempting to fix profiles...');
    
    // Get all user profiles that need fixing
    const { data: allProfiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name')
      .or('email.eq.unknown@example.com,first_name.eq.User,last_name.eq.');

    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError);
      return;
    }

    console.log(`📊 Found ${allProfiles.length} profiles that need fixing`);

    // For each profile, try to get the auth user data and update
    for (const profile of allProfiles) {
      try {
        // Get auth user data
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);
        
        if (authError) {
          console.log(`⚠️  Could not get auth data for user ${profile.user_id}:`, authError.message);
          continue;
        }

        if (authUser.user) {
          const updates = {};
          
          if (profile.email === 'unknown@example.com' && authUser.user.email) {
            updates.email = authUser.user.email;
          }
          
          if (profile.first_name === 'User' && authUser.user.user_metadata?.first_name) {
            updates.first_name = authUser.user.user_metadata.first_name;
          }
          
          if (profile.last_name === '' && authUser.user.user_metadata?.last_name) {
            updates.last_name = authUser.user.user_metadata.last_name;
          }

          if (Object.keys(updates).length > 0) {
            updates.updated_at = new Date().toISOString();
            
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update(updates)
              .eq('user_id', profile.user_id);

            if (updateError) {
              console.log(`❌ Error updating profile for user ${profile.user_id}:`, updateError.message);
            } else {
              console.log(`✅ Updated profile for user ${profile.user_id}`);
            }
          }
        }
      } catch (err) {
        console.log(`❌ Error processing profile ${profile.user_id}:`, err.message);
      }
    }

    // Step 3: Verify the fix
    console.log('📝 Step 3: Verifying the fix...');
    const { data: verificationData, error: verifyError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        first_name,
        last_name,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
    } else {
      console.log('✅ Verification successful. Recent profiles:');
      console.table(verificationData);
    }

    // Step 4: Check remaining issues
    const { data: remainingIssues, error: remainingError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name')
      .or('email.eq.unknown@example.com,first_name.eq.User,last_name.eq.');

    if (!remainingError) {
      console.log(`📊 Remaining profiles with issues: ${remainingIssues.length}`);
      if (remainingIssues.length > 0) {
        console.table(remainingIssues);
      }
    }

    console.log('🎉 Authentication fix completed!');

  } catch (err) {
    console.error('❌ Error applying fix:', err);
  }
}

applyFix();
