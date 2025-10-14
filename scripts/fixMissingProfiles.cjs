/**
 * FIX MISSING PROFILES SCRIPT
 * Δημιουργεί profiles για χρήστες που έχουν membership requests αλλά δεν έχουν profile
 */

const { createClient } = require('@supabase/supabase-js');

// Hardcoded Supabase credentials
const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixMissingProfiles() {
  console.log('🔧 Fixing Missing Profiles for Membership Requests...');
  console.log('');

  try {
    // 1. Find users with membership requests but no profiles
    console.log('1️⃣ Finding users with membership requests but no profiles...');
    
    const { data: membershipRequests, error: requestsError } = await supabase
      .from('membership_requests')
      .select('user_id')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('❌ Error fetching membership requests:', requestsError.message);
      return;
    }

    console.log(`✅ Found ${membershipRequests.length} membership requests`);

    // Get unique user IDs
    const uniqueUserIds = [...new Set(membershipRequests.map(r => r.user_id))];
    console.log(`✅ Found ${uniqueUserIds.length} unique users with membership requests`);

    // 2. Check which users don't have profiles
    console.log('2️⃣ Checking which users don\'t have profiles...');
    
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .in('user_id', uniqueUserIds);

    if (profilesError) {
      console.error('❌ Error fetching existing profiles:', profilesError.message);
      return;
    }

    const existingProfileUserIds = new Set(existingProfiles.map(p => p.user_id));
    const missingProfileUserIds = uniqueUserIds.filter(id => !existingProfileUserIds.has(id));

    console.log(`✅ Found ${existingProfiles.length} users with profiles`);
    console.log(`⚠️ Found ${missingProfileUserIds.length} users missing profiles`);

    if (missingProfileUserIds.length === 0) {
      console.log('🎉 All users have profiles! No fix needed.');
      return;
    }

    // 3. Create profiles for missing users
    console.log('3️⃣ Creating profiles for missing users...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const userId of missingProfileUserIds) {
      try {
        console.log(`Creating profile for user: ${userId}`);
        
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            email: `user_${userId.substring(0, 8)}@freegym.gr`,
            first_name: 'Χρήστης',
            last_name: '',
            phone: null,
            language: 'el',
            role: 'user',
            referral_code: `REF${userId.substring(0, 8)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`❌ Error creating profile for ${userId}:`, insertError.message);
          errorCount++;
        } else {
          console.log(`✅ Created profile for ${userId}`);
          successCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));

      } catch (error) {
        console.error(`❌ Exception creating profile for ${userId}:`, error.message);
        errorCount++;
      }
    }

    // 4. Summary
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`✅ Successfully created: ${successCount} profiles`);
    console.log(`❌ Failed to create: ${errorCount} profiles`);
    console.log(`📋 Total processed: ${missingProfileUserIds.length} users`);

    if (successCount > 0) {
      console.log('');
      console.log('🎉 Fix completed! The Secretary Dashboard should now show proper user names.');
      console.log('💡 Refresh the Secretary Dashboard to see the changes.');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixMissingProfiles().then(() => {
  console.log('');
  console.log('🔧 Missing profiles fix completed!');
}).catch(error => {
  console.error('❌ Fix failed:', error);
});

