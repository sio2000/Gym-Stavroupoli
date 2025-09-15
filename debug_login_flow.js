import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase URL or Anon Key is not defined in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugLoginFlow(email, password) {
  console.log('--- Starting Login Debug Flow ---');
  console.log(`Attempting to log in with email: ${email}`);

  try {
    // 1. Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase signInWithPassword Error:', error.message);
      return;
    }

    if (!data.user) {
      console.log('Login successful, but no user data returned.');
      return;
    }

    console.log(`Successfully logged in user: ${data.user.email} (ID: ${data.user.id})`);
    console.log('User session:', data.session);

    // 2. Get current session and user details
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Supabase getSession Error:', sessionError.message);
      return;
    }
    console.log('Current session after login:', session);

    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError) {
      console.error('Supabase getUser Error:', getUserError.message);
      return;
    }
    console.log('Current user details:', user);

    // 3. Fetch user profile from public.user_profiles
    console.log(`Fetching profile for user_id: ${user.id}`);
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Supabase fetch user_profiles Error:', profileError.message);
      return;
    }

    console.log('User Profile Data:', profile);
    console.log('User Role from Profile:', profile.role);

    // Simulate client-side redirect logic (RoleBasedRedirect)
    let redirectPath = '/';
    switch (profile.role) {
      case 'admin':
        redirectPath = '/admin/users';
        break;
      case 'trainer':
        redirectPath = '/trainer/mike'; // Assuming 'mike' is default for trainers
        break;
      case 'secretary':
        redirectPath = '/secretary/dashboard';
        break;
      case 'user':
      default:
        redirectPath = '/membership'; // This is the intended redirect
        break;
    }

    console.log(`Simulated RoleBasedRedirect path: ${redirectPath}`);

    // 4. Check if email is confirmed (relevant for registration flow, but good to check)
    if (user.email_confirmed_at === null) {
      console.warn('User email is NOT confirmed. This might affect some app functionalities.');
    } else {
      console.log('User email is confirmed.');
    }

    console.log('--- Login Debug Flow Completed ---');

  } catch (error) {
    console.error('An unexpected error occurred during login debug:', error.message);
  } finally {
    // Ensure logout to clear session for next test
    await supabase.auth.signOut();
    console.log('Logged out after debug session.');
  }
}

// Example usage: Replace with actual test user credentials
const TEST_USER_EMAIL = 'test@example.com'; // Replace with a user that has 'user' role
const TEST_USER_PASSWORD = 'password123'; // Replace with the user's password

debugLoginFlow(TEST_USER_EMAIL, TEST_USER_PASSWORD);