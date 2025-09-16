import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!url || !anon) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const email = `test_${Date.now()}@obirah.com`;
const password = 'TestUser1!';

console.log('[TestSignup] Using project:', url);
console.log('[TestSignup] Trying email:', email);

const client = createClient(url, anon);

try {
  const { data, error } = await client.auth.signUp({ email, password });
  console.log('[TestSignup] Response data:', data);
  if (error) {
    console.error('[TestSignup] ERROR:', error.name, error.message);
    console.error('[TestSignup] Status:', error.status);
    if (error.error) console.error('[TestSignup] Error field:', error.error);
  } else {
    console.log('[TestSignup] SignUp OK. Check inbox for confirmation.');
  }
} catch (e) {
  console.error('[TestSignup] Exception:', e);
}

// Optional: with service key, check if row exists in auth.users after attempt
if (service) {
  try {
    const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await admin.from('auth.users').select('id, email').ilike('email', email).maybeSingle();
    console.log('[TestSignup] Admin check auth.users exists:', { row: data, error });
  } catch (e) {
    console.error('[TestSignup] Admin check failed:', e.message || e);
  }
}


