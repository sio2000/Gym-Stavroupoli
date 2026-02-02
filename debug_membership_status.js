// Debug script to check membership status in database
// Run this in browser console to check the current state

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vnjzdzpwcvfehfkhbyqt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuampkenpwd2N2ZmVoZmtoYnlxdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE0NzU0MjE1LCJleHAiOjE4NzI1MjA2MTV9.sVrEKrCCj1ygNzlqXvGBY22FVT9W49gfdJzQGl3vxJ8'
);

async function checkMembershipStatus() {
  console.log('🔍 Checking membership status in database...\n');

  // Get all memberships with end_date < today
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('memberships')
    .select(`
      id,
      user_id,
      status,
      is_active,
      end_date,
      user_profiles!inner(
        first_name,
        last_name,
        email
      ),
      membership_packages!inner(name)
    `)
    .lt('end_date', today);  // end_date < TODAY

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('✅ No expired memberships found in database!');
    return;
  }

  console.log(`⚠️  Found ${data.length} memberships with end_date < TODAY:\n`);
  
  data.forEach((m, i) => {
    console.log(`${i+1}. User: ${m.user_profiles.first_name} ${m.user_profiles.last_name}`);
    console.log(`   Package: ${m.membership_packages.name}`);
    console.log(`   End Date: ${m.end_date}`);
    console.log(`   is_active: ${m.is_active}`);
    console.log(`   status: ${m.status}`);
    console.log(`   ❌ PROBLEM: is_active=${m.is_active}, status=${m.status}`);
    console.log('');
  });

  // Now check which user you're looking for
  console.log('\n📍 Looking for user "tr tr" with Pilates membership...\n');
  
  const { data: userMemberships } = await supabase
    .from('memberships')
    .select(`
      id,
      status,
      is_active,
      end_date,
      membership_packages(name)
    `)
    .eq('user_id', 'f6311f2d-8ac0-4bc0-ba97-ffb4873e9155');  // tr tr user ID from your screenshot

  if (userMemberships && userMemberships.length > 0) {
    console.log('Memberships for "tr tr":');
    userMemberships.forEach(m => {
      console.log(`- ${m.membership_packages.name}`);
      console.log(`  End Date: ${m.end_date}, is_active: ${m.is_active}, status: ${m.status}`);
    });
  }
}

// Run it
checkMembershipStatus().catch(console.error);
