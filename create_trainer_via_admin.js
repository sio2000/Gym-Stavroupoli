// Create trainer via Supabase Admin API
// This is the proper way to create users in Supabase

const { createClient } = require('@supabase/supabase-js');

// You need to get these from your Supabase project settings
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // Use service role key, not anon key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTrainer() {
  try {
    console.log('Creating trainer via Admin API...');
    
    // Create user via Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'trainer@freegym.gr',
      password: 'trainer123',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: 'Trainer',
        last_name: 'User'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Auth user created:', authData.user);

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        first_name: 'Trainer',
        last_name: 'User',
        email: 'trainer@freegym.gr',
        role: 'trainer'
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }

    console.log('Profile created:', profileData);

    // Test login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'trainer@freegym.gr',
      password: 'trainer123'
    });

    if (loginError) {
      console.error('Login test failed:', loginError);
    } else {
      console.log('Login test successful:', loginData.user);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
createTrainer();


