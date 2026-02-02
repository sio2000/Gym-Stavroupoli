import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, serviceKey!);

async function test() {
  console.log('Testing database connection...\n');

  // Check user profiles
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('user_id, email, first_name, last_name')
    .limit(5);
  
  console.log('User Profiles:', users?.length || 0);
  if (usersError) console.log('  Error:', usersError.message);

  // Check memberships without join first
  const { data: memberships, error: membError } = await supabase
    .from('memberships')
    .select('id, user_id, status, is_active, start_date, end_date')
    .limit(5);
  
  console.log('Memberships:', memberships?.length || 0);
  if (membError) console.log('  Error:', membError.message);

  // Check membership_packages
  const { data: packages, error: pkgError } = await supabase
    .from('membership_packages')
    .select('id, name')
    .limit(5);
  
  console.log('Packages:', packages?.length || 0);
  if (pkgError) console.log('  Error:', pkgError.message);

  console.log('\nChecking data types...');
  console.log('Users type:', Array.isArray(users) ? 'array' : typeof users);
  console.log('Memberships type:', Array.isArray(memberships) ? 'array' : typeof memberships);
  console.log('Packages type:', Array.isArray(packages) ? 'array' : typeof packages);
}

test().catch(console.error);
