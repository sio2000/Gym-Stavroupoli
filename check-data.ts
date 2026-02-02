import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env file
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key] = valueParts.join('=');
  }
});

const supabase = createClient(envVars['VITE_SUPABASE_URL']!, envVars['VITE_SUPABASE_SERVICE_KEY']!);

(async () => {
  // Get existing users
  const { data: users, count } = await supabase
    .from('user_profiles')
    .select('user_id, email, first_name, last_name', { count: 'exact' })
    .limit(5);

  console.log('Total users:', count);
  console.log('Sample users:', users);

  // Get memberships
  const { data: mems, count: memCount } = await supabase
    .from('memberships')
    .select('id, user_id, status, start_date, end_date', { count: 'exact' })
    .limit(5);

  console.log('\nTotal memberships:', memCount);
  console.log('Sample memberships:', mems);

  // Check if user_profiles has the right foreign key setup
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id')
    .limit(3);

  console.log('\nUser IDs from profiles:', profiles?.map(p => p.user_id));
})();
