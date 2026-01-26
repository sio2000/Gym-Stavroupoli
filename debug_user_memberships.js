import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nolqodpfaqdnprixaqlo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0'
);

async function runDebugQuery() {
  console.log('=== ΕΛΕΓΧΟΣ ΠΛΗΡΟΦΟΡΙΩΝ ΧΡΗΣΤΗ: Μαστοροδήμου Σταυρούλα (stavmst18@gmail.com) ===');
  console.log('User ID: 617c6696-3a17-4e1a-9cf2-26d4c2c12411');
  console.log('');

  try {
    // 1. ΒΑΣΙΚΕΣ ΠΛΗΡΟΦΟΡΙΕΣ ΧΡΗΣΤΗ
    console.log('1. === ΒΑΣΙΚΕΣ ΠΛΗΡΟΦΟΡΙΕΣ ΧΡΗΣΤΗ ===');
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, phone, dob, created_at, referral_code, role')
      .eq('user_id', '617c6696-3a17-4e1a-9cf2-26d4c2c12411')
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
    } else {
      console.table([userData]);
    }

    // 2. ΕΝΕΡΓΕΣ ΣΥΝΔΡΟΜΕΣ
    console.log('\n2. === ΕΝΕΡΓΕΣ ΣΥΝΔΡΟΜΕΣ ===');
    const { data: activeMemberships, error: activeError } = await supabase
      .from('memberships')
      .select(`
        id,
        package_id,
        start_date,
        end_date,
        is_active,
        status,
        duration_type,
        created_at,
        source_package_name,
        membership_packages!inner(name)
      `)
      .eq('user_id', '617c6696-3a17-4e1a-9cf2-26d4c2c12411')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]);

    if (activeError) {
      console.error('Error fetching active memberships:', activeError);
    } else {
      console.table(activeMemberships.map(m => ({
        id: m.id,
        package_name: m.membership_packages?.name,
        source_package_name: m.source_package_name,
        start_date: m.start_date,
        end_date: m.end_date,
        is_active: m.is_active,
        status: m.status,
        duration_type: m.duration_type,
        created_at: m.created_at
      })));
    }

    // 3. PILATES DEPOSITS
    console.log('\n3. === PILATES DEPOSITS ===');
    const { data: deposits, error: depositsError } = await supabase
      .from('pilates_deposits')
      .select('id, deposit_remaining, is_active, credited_at, expires_at, package_id')
      .eq('user_id', '617c6696-3a17-4e1a-9cf2-26d4c2c12411');

    if (depositsError) {
      console.error('Error fetching pilates deposits:', depositsError);
    } else {
      console.table(deposits);
    }

    // 4. MEMBERSHIP REQUESTS
    console.log('\n4. === MEMBERSHIP REQUESTS ===');
    const { data: requests, error: requestsError } = await supabase
      .from('membership_requests')
      .select(`
        id,
        package_id,
        duration_type,
        requested_price,
        status,
        created_at,
        approved_at,
        membership_packages!inner(name)
      `)
      .eq('user_id', '617c6696-3a17-4e1a-9cf2-26d4c2c12411');

    if (requestsError) {
      console.error('Error fetching membership requests:', requestsError);
    } else {
      console.table(requests.map(r => ({
        id: r.id,
        package_name: r.membership_packages?.name,
        duration_type: r.duration_type,
        requested_price: r.requested_price,
        status: r.status,
        created_at: r.created_at,
        approved_at: r.approved_at
      })));
    }

    // 5. Check for Ultimate memberships specifically
    console.log('\n5. === ULTIMATE MEMBERSHIPS CHECK ===');
    const { data: ultimateMemberships, error: ultimateError } = await supabase
      .from('memberships')
      .select(`
        id,
        package_id,
        start_date,
        end_date,
        is_active,
        source_package_name,
        membership_packages!inner(name)
      `)
      .eq('user_id', '617c6696-3a17-4e1a-9cf2-26d4c2c12411')
      .in('source_package_name', ['Ultimate', 'Ultimate Medium']);

    if (ultimateError) {
      console.error('Error fetching Ultimate memberships:', ultimateError);
    } else {
      console.log('Ultimate memberships found:', ultimateMemberships.length);
      if (ultimateMemberships.length > 0) {
        console.table(ultimateMemberships.map(m => ({
          id: m.id,
          package_name: m.membership_packages?.name,
          source_package_name: m.source_package_name,
          start_date: m.start_date,
          end_date: m.end_date,
          is_active: m.is_active
        })));
      }
    }

  } catch (error) {
    console.error('Error running debug query:', error);
  }
}

runDebugQuery();