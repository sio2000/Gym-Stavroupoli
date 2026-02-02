/**
 * Create memberships and pilates deposits for all real test users
 * No existing subscriptions - we'll create them fresh
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env
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

// Real test users mapped to subscription types
const TEST_USERS = {
  ultimate: [
    'b898f7fc-b0f5-4a80-b9cb-85ac010d1083',
    '8b9f3274-ceed-4378-8202-fb0c593bebc4',
    '18139e41-e1c5-4b40-98e4-b713987b8d21',
    '9f222a90-9846-4cbe-8bc3-3aff68017f6d',
    'c56a223c-4275-4bd2-a14d-6f59c39d295e',
  ],
  ultimate_medium: [
    'f9a5b3d1-66f3-43a0-a09a-de0130ef9d87',
    'c5405500-fa53-4388-8910-16eb32ce3796',
    '6a2fceaa-6595-4ca7-b635-9a7013128eec',
    '6f63518a-9bf0-40f9-8a4e-a9e9ac3fcf9b',
    'fddea114-55ef-41de-9eff-16cc1b98fd67',
  ],
  freegym: [
    '818369d4-e2af-4b2e-aeab-bf7ee1423a6f',
    '5b699842-8581-49de-b7c2-7150cde1b0b7',
    '148e5ca3-bf80-4cea-b76f-39468ef795df',
    'f428eb6c-83d9-4cbf-81db-ef9877f5749c',
    '29d544d5-4278-4226-a003-3223b8ff092c',
  ],
  pilates: [
    '69c3a037-d49f-4835-8623-8c969abcd187',
    '31278f5c-6460-4cb6-bc84-6403ee35a72b',
    '5bd3ae13-3f8c-4125-a64a-dccddfdec50f',
    '115af99b-0279-4166-9634-bafe1c2e4c3c',
    '2716f0dd-7a02-4d75-afa2-6b794c049208',
  ],
};

async function log(message: string) {
  console.log(`📋 ${message}`);
}

async function createMembershipsForType(
  userIds: string[],
  packageName: string,
  daysValid: number
) {
  log(`Creating ${packageName} memberships...`);

  // Get package
  const { data: packages } = await supabase
    .from('membership_packages')
    .select('id')
    .eq('name', packageName);

  if (!packages || packages.length === 0) {
    log(`❌ Package not found: ${packageName}`);
    return;
  }

  const packageId = packages[0].id;
  const startDate = new Date('2026-01-31');
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysValid);

  const created: string[] = [];
  const failed: string[] = [];

  for (const userId of userIds) {
    try {
      // Check if user already has this type of membership
      const { data: existing } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('membership_package_id', packageId);

      if (existing && existing.length > 0) {
        log(`⏭️  User ${userId} already has ${packageName}`);
        continue;
      }

      // Create membership
      const { data: membership, error } = await supabase
        .from('memberships')
        .insert({
          user_id: userId,
          package_id: packageId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_active: true,
          status: 'active',
        })
        .select();

      if (error) {
        log(`❌ Failed to create membership for ${userId}: ${error.message}`);
        failed.push(userId);
      } else {
        log(`✅ Created ${packageName} for ${userId}`);
        created.push(userId);

        // For pilates, create initial deposit
        if (packageName === 'Pilates') {
          const { error: depositError } = await supabase
            .from('pilates_deposits')
            .insert({
              user_id: userId,
              package_id: packageId,
              deposit_remaining: 4, // Initial pilates deposit
              expires_at: endDate.toISOString(),
              is_active: true,
            });

          if (depositError) {
            log(`⚠️  Failed to create deposit: ${depositError.message}`);
          } else {
            log(`   └─ Created initial pilates deposit (4 lessons)`);
          }
        }
      }
    } catch (error) {
      log(`❌ Error for ${userId}: ${error}`);
      failed.push(userId);
    }
  }

  log(`Summary for ${packageName}: ${created.length} created, ${failed.length} failed`);
  return { created, failed };
}

async function main() {
  console.log('\n🚀 SETTING UP MEMBERSHIPS FOR REAL TEST USERS');
  console.log('='.repeat(80));

  const baseDate = new Date('2026-01-31');

  // Ultimate: 3 lessons/week, valid for 30 days
  await createMembershipsForType(TEST_USERS.ultimate, 'Ultimate', 30);

  // Ultimate Medium: 1 lesson/week, valid for 30 days
  await createMembershipsForType(TEST_USERS.ultimate_medium, 'Ultimate Medium', 30);

  // FreeGym: simple gym, valid for 30 days
  await createMembershipsForType(TEST_USERS.freegym, 'Free Gym', 30);

  // Pilates: 4 lessons initially, valid for 30 days
  await createMembershipsForType(TEST_USERS.pilates, 'Pilates', 30);

  console.log('\n' + '='.repeat(80));
  log('✅ Membership setup complete!');
  log('Ready to run comprehensive tests with: npm run test:comprehensive');
}

main().catch(console.error);
