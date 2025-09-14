// Create Katerina trainer via Supabase Auth API
// This is the proper way to create users in Supabase

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createKaterinaTrainer() {
  try {
    console.log('Creating Katerina trainer...');
    
    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'katerina@freegym.gr',
      password: 'trainer123',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: 'Katerina',
        last_name: 'Trainer'
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
        first_name: 'Katerina',
        last_name: 'Trainer',
        email: 'katerina@freegym.gr',
        role: 'trainer'
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }

    console.log('Profile created:', profileData);

    // Test login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'katerina@freegym.gr',
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
createKaterinaTrainer();


