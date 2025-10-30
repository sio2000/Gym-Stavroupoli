// Check what package names exist
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkPackageNames() {
  console.log('\n🔍 Checking package names...\n');

  const { data: packages } = await supabase
    .from('pilates_packages')
    .select('id, name')
    .order('name');

  if (!packages || packages.length === 0) {
    console.log('❌ No packages found');
    return;
  }

  console.log(`📦 Found ${packages.length} packages:\n`);
  packages.forEach(p => {
    console.log(`   - ${p.name} (ID: ${p.id})`);
  });

  // Now check deposits
  console.log('\n📊 Checking deposits...\n');

  const { data: deposits } = await supabase
    .from('pilates_deposits')
    .select(`
      id,
      user_id,
      package_id,
      deposit_remaining,
      is_active,
      user:user_profiles(first_name, last_name),
      package:pilates_packages(name)
    `)
    .eq('is_active', true)
    .limit(50);

  if (deposits && deposits.length > 0) {
    console.log(`Found ${deposits.length} active deposits:\n`);
    
    deposits.forEach((d, i) => {
      console.log(`${i + 1}. ${d.user?.first_name} ${d.user?.last_name}`);
      console.log(`   Package: ${d.package?.name || 'N/A'}`);
      console.log(`   Remaining: ${d.deposit_remaining}`);
      console.log('');
    });
  }
}

checkPackageNames().catch(console.error);

