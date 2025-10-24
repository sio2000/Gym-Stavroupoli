// Setup test deposits for users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function setupTestDeposits() {
  console.log('\n🔧 Setting up test deposits...\n');

  // Get all users
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name')
    .limit(50);

  if (!users || users.length === 0) {
    console.log('❌ No users found');
    return;
  }

  console.log(`📊 Found ${users.length} users\n`);

  // Create a dummy package
  const { data: dummyPackage } = await supabase
    .from('pilates_packages')
    .select('id')
    .limit(1)
    .single();

  if (!dummyPackage) {
    console.log('⚠️  No packages found, creating deposits without package_id');
  }

  let created = 0;
  let errors = 0;

  for (const user of users) {
    // Check if user already has active deposit
    const { data: existing } = await supabase
      .from('pilates_deposits')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('deposit_remaining', 0)
      .limit(1)
      .single();

    if (existing) {
      console.log(`⏭️  ${user.first_name} ${user.last_name} already has deposit`);
      continue;
    }

    // Create deposit
    const { error } = await supabase
      .from('pilates_deposits')
      .insert({
        user_id: user.id,
        package_id: dummyPackage?.id || null,
        deposit_remaining: 10,
        credited_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_by: 'test-setup'
      });

    if (error) {
      console.log(`❌ ${user.first_name} ${user.last_name}: ${error.message}`);
      errors++;
    } else {
      console.log(`✅ ${user.first_name} ${user.last_name}: Created deposit (10 classes)`);
      created++;
    }
  }

  console.log('\n═'.repeat(60));
  console.log(`\n✅ Created: ${created} deposits`);
  console.log(`❌ Errors: ${errors}`);
  console.log('\n🎊 Setup complete! Ready for tests!\n');
}

setupTestDeposits().catch(console.error);

