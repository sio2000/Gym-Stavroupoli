// ============================================================================
// SETUP ADMIN & RECEPTION ACCOUNTS WITH PASSWORDS
// ============================================================================
// Χρησιμοποιήστε αυτό το script για να ορίσετε τα passwords
// 
// npm install @supabase/supabase-js
// node SETUP_PASSWORDS.js
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

// Διαμόρφωση Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Accounts και passwords
const ACCOUNTS = [
  {
    email: 'admin@freegym.gr',
    password: 'admin123',
    role: 'admin'
  },
  {
    email: 'receptiongym2025@gmail.com',
    password: 'Reception123!',
    role: 'reception'
  }
];

async function setupAccounts() {
  try {
    console.log('🔐 Starting Admin & Reception Account Setup...\n');

    // Χρησιμοποιούμε το Service Role key για admin operations
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not found in environment');
      console.log('Set it in your .env.local file');
      process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    for (const account of ACCOUNTS) {
      console.log(`\n📧 Processing: ${account.email}`);
      console.log(`   Role: ${account.role}`);
      console.log(`   Password: ${account.password}`);

      // Ενημέρωση password
      const { data, error } = await supabase.auth.admin.updateUserById(
        // Πρώτα βρίσκουμε το user
        (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === account.email)?.id,
        {
          password: account.password,
          email_confirm: true // Confirm email
        }
      );

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Password updated successfully`);
      }

      // Ενημέρωση user_profile role
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ role: account.role })
        .eq('id', data?.user?.id);

      if (profileError) {
        console.error(`   ❌ Profile Error: ${profileError.message}`);
      } else {
        console.log(`   ✅ Profile role updated: ${account.role}`);
      }
    }

    console.log('\n\n✅ ============================================');
    console.log('✅ SETUP COMPLETE - Ready to Login');
    console.log('✅ ============================================\n');

    console.log('🔑 ADMIN PANEL:');
    console.log('   Email: admin@freegym.gr');
    console.log('   Password: admin123\n');

    console.log('🔑 RECEPTION PANEL:');
    console.log('   Email: receptiongym2025@gmail.com');
    console.log('   Password: Reception123!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

setupAccounts();
