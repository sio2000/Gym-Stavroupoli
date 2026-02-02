/**
 * SUBSCRIPTION AUDIT TEST SUITE - SEED DATA
 * 
 * Creates 20 deterministic test users with various subscription scenarios
 * to validate the subscription lifecycle over time.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env file manually
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

const supabaseUrl = envVars['VITE_SUPABASE_URL'] || process.env.VITE_SUPABASE_URL;
const serviceKey = envVars['VITE_SUPABASE_SERVICE_KEY'] || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_SERVICE_KEY:', serviceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

/**
 * Test user configuration
 */
interface TestUserConfig {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  subscriptions: SubscriptionConfig[];
}

interface SubscriptionConfig {
  package_type: 'pilates' | 'free_gym' | 'ultimate' | 'ultimate_medium';
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  is_active: boolean;
  status: 'active' | 'expired';
  refill_credits?: number; // For Pilates
}

/**
 * Generate 20 test users with various subscription scenarios
 */
export function generateTestUsers(referenceDate: Date): TestUserConfig[] {
  const users: TestUserConfig[] = [];
  
  // Helper to add/subtract days
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const baseDate = referenceDate.toISOString().split('T')[0]; // Today

  // GROUP 1: Pilates users (5 users)
  // User 1: Active Pilates, expires tomorrow
  users.push({
    id: 'test-pilates-001',
    email: 'pilates-active-tomorrow@test.gym',
    first_name: 'Pilates',
    last_name: 'Tomorrow',
    subscriptions: [
      {
        package_type: 'pilates',
        start_date: addDays(new Date(baseDate), -30),
        end_date: addDays(new Date(baseDate), 1),
        is_active: true,
        status: 'active',
        refill_credits: 8
      }
    ]
  });

  // User 2: Active Pilates, expires today at 23:59
  users.push({
    id: 'test-pilates-002',
    email: 'pilates-expires-today@test.gym',
    first_name: 'Pilates',
    last_name: 'Today',
    subscriptions: [
      {
        package_type: 'pilates',
        start_date: addDays(new Date(baseDate), -30),
        end_date: baseDate,
        is_active: true,
        status: 'active',
        refill_credits: 8
      }
    ]
  });

  // User 3: Expired Pilates (expired yesterday)
  users.push({
    id: 'test-pilates-003',
    email: 'pilates-expired-yesterday@test.gym',
    first_name: 'Pilates',
    last_name: 'Expired',
    subscriptions: [
      {
        package_type: 'pilates',
        start_date: addDays(new Date(baseDate), -31),
        end_date: addDays(new Date(baseDate), -1),
        is_active: false,
        status: 'expired',
        refill_credits: 0
      }
    ]
  });

  // User 4: Active Pilates with multiple subscriptions (current + historical)
  users.push({
    id: 'test-pilates-004',
    email: 'pilates-renewer@test.gym',
    first_name: 'Pilates',
    last_name: 'Renewer',
    subscriptions: [
      // Current subscription
      {
        package_type: 'pilates',
        start_date: addDays(new Date(baseDate), -15),
        end_date: addDays(new Date(baseDate), 15),
        is_active: true,
        status: 'active',
        refill_credits: 8
      },
      // Historical subscription
      {
        package_type: 'pilates',
        start_date: addDays(new Date(baseDate), -45),
        end_date: addDays(new Date(baseDate), -15),
        is_active: false,
        status: 'expired',
        refill_credits: 0
      }
    ]
  });

  // User 5: Pilates with edge case - expires 60 days from now
  users.push({
    id: 'test-pilates-005',
    email: 'pilates-long-term@test.gym',
    first_name: 'Pilates',
    last_name: 'LongTerm',
    subscriptions: [
      {
        package_type: 'pilates',
        start_date: addDays(new Date(baseDate), -5),
        end_date: addDays(new Date(baseDate), 60),
        is_active: true,
        status: 'active',
        refill_credits: 8
      }
    ]
  });

  // GROUP 2: FreeGym users (5 users)
  // User 6: Active FreeGym
  users.push({
    id: 'test-freegym-001',
    email: 'freegym-active@test.gym',
    first_name: 'FreeGym',
    last_name: 'Active',
    subscriptions: [
      {
        package_type: 'free_gym',
        start_date: addDays(new Date(baseDate), -15),
        end_date: addDays(new Date(baseDate), 45),
        is_active: true,
        status: 'active'
      }
    ]
  });

  // User 7: Expired FreeGym
  users.push({
    id: 'test-freegym-002',
    email: 'freegym-expired@test.gym',
    first_name: 'FreeGym',
    last_name: 'Expired',
    subscriptions: [
      {
        package_type: 'free_gym',
        start_date: addDays(new Date(baseDate), -60),
        end_date: addDays(new Date(baseDate), -5),
        is_active: false,
        status: 'expired'
      }
    ]
  });

  // User 8: FreeGym expiring today
  users.push({
    id: 'test-freegym-003',
    email: 'freegym-today@test.gym',
    first_name: 'FreeGym',
    last_name: 'Today',
    subscriptions: [
      {
        package_type: 'free_gym',
        start_date: addDays(new Date(baseDate), -30),
        end_date: baseDate,
        is_active: true,
        status: 'active'
      }
    ]
  });

  // User 9: FreeGym with back-to-back subscriptions
  users.push({
    id: 'test-freegym-004',
    email: 'freegym-chained@test.gym',
    first_name: 'FreeGym',
    last_name: 'Chained',
    subscriptions: [
      // Current
      {
        package_type: 'free_gym',
        start_date: baseDate,
        end_date: addDays(new Date(baseDate), 30),
        is_active: true,
        status: 'active'
      },
      // Previous
      {
        package_type: 'free_gym',
        start_date: addDays(new Date(baseDate), -30),
        end_date: baseDate,
        is_active: false,
        status: 'expired'
      }
    ]
  });

  // User 10: FreeGym expiring tomorrow
  users.push({
    id: 'test-freegym-005',
    email: 'freegym-tomorrow@test.gym',
    first_name: 'FreeGym',
    last_name: 'Tomorrow',
    subscriptions: [
      {
        package_type: 'free_gym',
        start_date: addDays(new Date(baseDate), -29),
        end_date: addDays(new Date(baseDate), 1),
        is_active: true,
        status: 'active'
      }
    ]
  });

  // GROUP 3: Ultimate users (5 users)
  // User 11: Active Ultimate
  users.push({
    id: 'test-ultimate-001',
    email: 'ultimate-active@test.gym',
    first_name: 'Ultimate',
    last_name: 'Active',
    subscriptions: [
      {
        package_type: 'ultimate',
        start_date: addDays(new Date(baseDate), -10),
        end_date: addDays(new Date(baseDate), 50),
        is_active: true,
        status: 'active',
        refill_credits: 3
      }
    ]
  });

  // User 12: Expired Ultimate
  users.push({
    id: 'test-ultimate-002',
    email: 'ultimate-expired@test.gym',
    first_name: 'Ultimate',
    last_name: 'Expired',
    subscriptions: [
      {
        package_type: 'ultimate',
        start_date: addDays(new Date(baseDate), -90),
        end_date: addDays(new Date(baseDate), -30),
        is_active: false,
        status: 'expired',
        refill_credits: 0
      }
    ]
  });

  // User 13: Ultimate expiring in 2 days
  users.push({
    id: 'test-ultimate-003',
    email: 'ultimate-soon@test.gym',
    first_name: 'Ultimate',
    last_name: 'Soon',
    subscriptions: [
      {
        package_type: 'ultimate',
        start_date: addDays(new Date(baseDate), -28),
        end_date: addDays(new Date(baseDate), 2),
        is_active: true,
        status: 'active',
        refill_credits: 3
      }
    ]
  });

  // User 14: Ultimate with refill boundary
  users.push({
    id: 'test-ultimate-004',
    email: 'ultimate-refill@test.gym',
    first_name: 'Ultimate',
    last_name: 'Refill',
    subscriptions: [
      {
        package_type: 'ultimate',
        start_date: addDays(new Date(baseDate), -30),
        end_date: addDays(new Date(baseDate), 30),
        is_active: true,
        status: 'active',
        refill_credits: 3
      }
    ]
  });

  // User 15: Ultimate long-term
  users.push({
    id: 'test-ultimate-005',
    email: 'ultimate-longterm@test.gym',
    first_name: 'Ultimate',
    last_name: 'LongTerm',
    subscriptions: [
      {
        package_type: 'ultimate',
        start_date: addDays(new Date(baseDate), -60),
        end_date: addDays(new Date(baseDate), 60),
        is_active: true,
        status: 'active',
        refill_credits: 3
      }
    ]
  });

  // GROUP 4: Ultimate Medium users (5 users)
  // User 16: Active Ultimate Medium
  users.push({
    id: 'test-ultimate-medium-001',
    email: 'ultimate-medium-active@test.gym',
    first_name: 'UltimateMedium',
    last_name: 'Active',
    subscriptions: [
      {
        package_type: 'ultimate_medium',
        start_date: addDays(new Date(baseDate), -7),
        end_date: addDays(new Date(baseDate), 53),
        is_active: true,
        status: 'active',
        refill_credits: 1
      }
    ]
  });

  // User 17: Expired Ultimate Medium
  users.push({
    id: 'test-ultimate-medium-002',
    email: 'ultimate-medium-expired@test.gym',
    first_name: 'UltimateMedium',
    last_name: 'Expired',
    subscriptions: [
      {
        package_type: 'ultimate_medium',
        start_date: addDays(new Date(baseDate), -75),
        end_date: addDays(new Date(baseDate), -25),
        is_active: false,
        status: 'expired',
        refill_credits: 0
      }
    ]
  });

  // User 18: Ultimate Medium expiring in 3 days
  users.push({
    id: 'test-ultimate-medium-003',
    email: 'ultimate-medium-soon@test.gym',
    first_name: 'UltimateMedium',
    last_name: 'Soon',
    subscriptions: [
      {
        package_type: 'ultimate_medium',
        start_date: addDays(new Date(baseDate), -27),
        end_date: addDays(new Date(baseDate), 3),
        is_active: true,
        status: 'active',
        refill_credits: 1
      }
    ]
  });

  // User 19: Ultimate Medium with renewal
  users.push({
    id: 'test-ultimate-medium-004',
    email: 'ultimate-medium-renewer@test.gym',
    first_name: 'UltimateMedium',
    last_name: 'Renewer',
    subscriptions: [
      {
        package_type: 'ultimate_medium',
        start_date: addDays(new Date(baseDate), -5),
        end_date: addDays(new Date(baseDate), 55),
        is_active: true,
        status: 'active',
        refill_credits: 1
      },
      {
        package_type: 'ultimate_medium',
        start_date: addDays(new Date(baseDate), -35),
        end_date: addDays(new Date(baseDate), -5),
        is_active: false,
        status: 'expired',
        refill_credits: 0
      }
    ]
  });

  // User 20: Ultimate Medium edge case
  users.push({
    id: 'test-ultimate-medium-005',
    email: 'ultimate-medium-edge@test.gym',
    first_name: 'UltimateMedium',
    last_name: 'Edge',
    subscriptions: [
      {
        package_type: 'ultimate_medium',
        start_date: addDays(new Date(baseDate), -55),
        end_date: addDays(new Date(baseDate), 5),
        is_active: true,
        status: 'active',
        refill_credits: 1
      }
    ]
  });

  return users;
}

/**
 * Seed the database with test users and subscriptions
 */
export async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n');

  const referenceDate = new Date('2026-01-31'); // Current test date
  const testUsers = generateTestUsers(referenceDate);

  try {
    // 1. Create user profiles
    console.log('📝 Creating user profiles...');
    for (const testUser of testUsers) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: testUser.id,
          email: testUser.email,
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          phone: '6900000000',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error creating user ${testUser.id}:`, error);
      } else {
        console.log(`✅ Created user: ${testUser.id}`);
      }
    }

    // 2. Get package IDs
    console.log('\n📦 Fetching package IDs...');
    const { data: packages } = await supabase
      .from('membership_packages')
      .select('id, name');

    const packageMap = new Map();
    if (packages) {
      packages.forEach(pkg => {
        const normalized = pkg.name.toLowerCase();
        if (normalized.includes('pilates')) packageMap.set('pilates', pkg.id);
        else if (normalized.includes('free') || normalized.includes('open')) packageMap.set('free_gym', pkg.id);
        else if (normalized.includes('ultimate medium')) packageMap.set('ultimate_medium', pkg.id);
        else if (normalized.includes('ultimate')) packageMap.set('ultimate', pkg.id);
      });
    }

    console.log('Package map:', packageMap);

    // 3. Create memberships
    console.log('\n📅 Creating memberships...');
    for (const testUser of testUsers) {
      for (const sub of testUser.subscriptions) {
        const packageId = packageMap.get(sub.package_type);
        if (!packageId) {
          console.warn(`⚠️  Package not found for ${sub.package_type}`);
          continue;
        }

        const { error } = await supabase
          .from('memberships')
          .insert({
            user_id: testUser.id,
            package_id: packageId,
            start_date: sub.start_date,
            end_date: sub.end_date,
            is_active: sub.is_active,
            status: sub.status,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error(`❌ Error creating membership for ${testUser.id}:`, error);
        } else {
          console.log(`✅ Created membership: ${testUser.id} - ${sub.package_type}`);
        }
      }
    }

    console.log('\n✨ Test data seeding complete!\n');
    return testUsers;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData().catch(console.error);
}
