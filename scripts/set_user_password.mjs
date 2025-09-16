import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const service = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!url || !service) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Read args: --user <id> --password <pwd>
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const userId = getArg('--user');
const newPassword = getArg('--password');

if (!userId || !newPassword) {
  console.error('Usage: node scripts/set_user_password.mjs --user <uuid> --password <newPassword>');
  process.exit(1);
}

const supabase = createClient(url, service);

try {
  const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
  console.log('Password set successfully for user', userId);
} catch (err) {
  console.error('ERROR:', err.message || err);
  process.exit(1);
}


