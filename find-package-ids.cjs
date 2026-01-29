#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkPackagesColumn() {
  console.log('\n🔍 Checking for package definitions...\n');

  // Get all memberships and analyze package_id
  const { data: memberships, error } = await supabase
    .from('memberships')
    .select('*')
    .limit(100);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  if (!memberships || memberships.length === 0) {
    console.log('⚠️  No memberships found');
    return;
  }

  // Group by package_id and duration_type
  const packageMap = {};
  memberships.forEach(m => {
    const key = `${m.package_id}`;
    if (!packageMap[key]) {
      packageMap[key] = {
        package_id: m.package_id,
        duration_types: new Set(),
        count: 0
      };
    }
    packageMap[key].duration_types.add(m.duration_type);
    packageMap[key].count++;
  });

  console.log('Found package UUIDs:\n');
  Object.values(packageMap).forEach(pkg => {
    console.log(`📦 Package ID: ${pkg.package_id}`);
    console.log(`   Duration Types: ${[...pkg.duration_types].join(', ')}`);
    console.log(`   Count: ${pkg.count} memberships\n`);
  });

  // Let's also check the duration_type column values
  console.log('\nDuration Types in database:');
  const durationTypes = new Set();
  memberships.forEach(m => {
    durationTypes.add(m.duration_type);
  });
  [...durationTypes].sort().forEach(dt => {
    console.log(`  • ${dt}`);
  });
}

checkPackagesColumn();
