import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// Load .env file
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key] = valueParts.join('=');
  }
});

const supabase = createClient(envVars['VITE_SUPABASE_URL']!, envVars['VITE_SUPABASE_SERVICE_KEY']!);

async function createTestUsers() {
  console.log('Creating 20 test users...\n');

  // Generate 20 test users with proper UUIDs
  const testUsers = [];
  const userIds: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const id = uuidv4();
    userIds.push(id);
    testUsers.push({
      user_id: id,
      email: `bot.test.${i}@gym-test.local`,
      first_name: `Bot`,
      last_name: `Test${i}`
    });
  }

  // Insert users into user_profiles
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(testUsers, { onConflict: 'user_id' });

  if (error) {
    console.error('❌ Error creating users:', error.message);
    console.error('Details:', error);
    return;
  }

  console.log('✅ Created/Updated users:', testUsers.length);

  // Now create memberships for these users
  const baseDate = '2026-01-31'; // Today
  const memberships = [];
  const packages: Record<number, string> = {
    1: 'Pilates',
    2: 'Free Gym',
    3: 'Ultimate',
    4: 'Ultimate Medium'
  };

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const packageType = (i % 4) + 1; // Cycle through 4 packages
    const packageName = packages[packageType];
    
    // Calculate dates
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() - 15); // Started 15 days ago
    
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + 45); // Expires in 45 days
    
    memberships.push({
      user_id: userId,
      status: 'active',
      is_active: true,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  // Get the actual package IDs
  const { data: pkgs, error: pkgError } = await supabase
    .from('membership_packages')
    .select('id, name');

  if (pkgError) {
    console.error('❌ Error fetching packages:', pkgError.message);
    return;
  }

  console.log('✅ Fetched packages:', pkgs?.length || 0);

  // Map membership package names to IDs
  const packageMap: Record<string, string> = {};
  pkgs?.forEach(pkg => {
    packageMap[pkg.name] = pkg.id;
  });

  // Update memberships with correct package IDs
  const membershipsWithIds = memberships.map((m, idx) => {
    const packageType = (idx % 4) + 1;
    const packageName = packages[packageType];
    return {
      ...m,
      membership_package_id: packageMap[packageName]
    };
  });

  // Insert memberships
  const { data: membData, error: membError } = await supabase
    .from('memberships')
    .upsert(membershipsWithIds, { onConflict: 'id' });

  if (membError) {
    console.error('❌ Error creating memberships:', membError.message);
    return;
  }

  console.log('✅ Created/Updated memberships:', membershipsWithIds.length);
  console.log('\n✅ Test data seeded successfully!');
}

createTestUsers().catch(console.error);
