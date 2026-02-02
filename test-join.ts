import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  const { data, error } = await supabase
    .from('memberships')
    .select(`
      id,
      user_id,
      status,
      is_active,
      start_date,
      end_date,
      membership_packages!inner(name)
    `)
    .limit(2);
  
  console.log('Join query result:');
  console.log('Error:', error?.message || 'none');
  console.log('Data type:', Array.isArray(data) ? 'array' : typeof data);
  if (error) {
    console.log('Full error:', error);
  } else {
    console.log('First record:', JSON.stringify(data?.[0], null, 2));
  }
})();
