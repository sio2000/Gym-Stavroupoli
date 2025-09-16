import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const service = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!url || !service) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const email = `admintest_${Date.now()}@obirah.com`;
const password = 'TestUser1!';

console.log('[AdminCreateUser] Using project:', url);
console.log('[AdminCreateUser] Trying email:', email);

const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });

try {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: 'Test', last_name: 'User' }
  });
  console.log('[AdminCreateUser] Response data:', data);
  if (error) {
    console.error('[AdminCreateUser] ERROR:', error.name || 'error', error.message || error);
  } else {
    console.log('[AdminCreateUser] OK, user id:', data.user?.id);
  }
} catch (e) {
  console.error('[AdminCreateUser] Exception:', e.message || e);
}


