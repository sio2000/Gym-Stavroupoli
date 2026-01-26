import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nolqodpfaqdnprixaqlo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0'
);

async function checkUltimateMemberships() {
  console.log('=== CHECKING ULTIMATE MEMBERSHIPS IN SYSTEM ===');

  try {
    // Find all memberships with Ultimate source_package_name
    const { data: ultimateMemberships, error: ultimateError } = await supabase
      .from('memberships')
      .select(`
        id,
        user_id,
        package_id,
        start_date,
        end_date,
        is_active,
        source_package_name,
        membership_packages!inner(name),
        user_profiles!inner(first_name, last_name, email)
      `)
      .in('source_package_name', ['Ultimate', 'Ultimate Medium'])
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .limit(10);

    if (ultimateError) {
      console.error('Error fetching Ultimate memberships:', ultimateError);
      return;
    }

    console.log(`Found ${ultimateMemberships.length} active Ultimate memberships:`);

    if (ultimateMemberships.length > 0) {
      console.table(ultimateMemberships.map(m => ({
        user_name: `${m.user_profiles.first_name} ${m.user_profiles.last_name}`,
        email: m.user_profiles.email,
        package_name: m.membership_packages.name,
        source_package_name: m.source_package_name,
        start_date: m.start_date,
        end_date: m.end_date,
        is_active: m.is_active
      })));

      // Check if any of these users have multiple memberships (Pilates + Free Gym)
      for (const ultimateMembership of ultimateMemberships) {
        const { data: allMemberships, error: allError } = await supabase
          .from('memberships')
          .select(`
            id,
            package_id,
            is_active,
            source_package_name,
            membership_packages!inner(name)
          `)
          .eq('user_id', ultimateMembership.user_id)
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString().split('T')[0]);

        if (!allError && allMemberships) {
          console.log(`\nUser ${ultimateMembership.user_profiles.first_name} ${ultimateMembership.user_profiles.last_name} has ${allMemberships.length} active memberships:`);
          console.table(allMemberships.map(m => ({
            package_name: m.membership_packages.name,
            source_package_name: m.source_package_name,
            is_active: m.is_active
          })));
        }
      }
    } else {
      console.log('No active Ultimate memberships found in the system.');
    }

    // Check recent Ultimate requests
    console.log('\n=== CHECKING RECENT ULTIMATE REQUESTS ===');
    const { data: recentRequests, error: requestsError } = await supabase
      .from('membership_requests')
      .select(`
        id,
        user_id,
        status,
        created_at,
        approved_at,
        membership_packages!inner(name),
        user_profiles!inner(first_name, last_name, email)
      `)
      .eq('membership_packages.name', 'Ultimate')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!requestsError && recentRequests) {
      console.log(`Found ${recentRequests.length} recent Ultimate requests:`);
      console.table(recentRequests.map(r => ({
        user_name: `${r.user_profiles.first_name} ${r.user_profiles.last_name}`,
        email: r.user_profiles.email,
        status: r.status,
        created_at: r.created_at,
        approved_at: r.approved_at
      })));
    }

  } catch (error) {
    console.error('Error checking Ultimate memberships:', error);
  }
}

checkUltimateMemberships();