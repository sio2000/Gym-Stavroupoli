import { vi } from 'vitest';
vi.unmock('@supabase/supabase-js');

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co',
  process.env.VITE_SUPABASE_SERVICE_KEY || ''
);

async function test() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, email, first_name, last_name');

  console.log('Type of data:', typeof data);
  console.log('Is array:', Array.isArray(data));
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
