#!/usr/bin/env node

/**
 * Check packages in the database
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkPackages() {
  console.log('\n🔍 Checking packages table...\n');

  // Try to get packages
  const { data: packages, error: packagesError } = await supabase
    .from('packages')
    .select('*')
    .limit(10);

  if (packagesError) {
    console.log(`❌ Error querying packages:`, packagesError.message);
  } else if (packages && packages.length > 0) {
    console.log(`✅ Found ${packages.length} packages:`);
    packages.forEach((pkg, idx) => {
      console.log(`\n${idx + 1}. ${pkg.name || pkg.package_name || 'Unknown'}`);
      console.log(`   ID: ${pkg.id}`);
      console.log(`   Data:`, JSON.stringify(pkg, null, 2));
    });
  } else {
    console.log(`⚠️  No packages found in packages table`);
  }

  // Check if memberships table exists
  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select('*')
    .limit(1);

  console.log(`\n🔍 Checking memberships table...\n`);
  if (membershipsError) {
    console.log(`❌ Error querying memberships:`, membershipsError.message);
  } else if (memberships && memberships.length > 0) {
    console.log(`✅ Found sample membership:`);
    console.log(JSON.stringify(memberships[0], null, 2));
  } else {
    console.log(`⚠️  No memberships found in memberships table`);
  }
}

checkPackages();
