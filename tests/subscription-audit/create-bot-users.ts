/**
 * CREATE BOT USERS FOR TESTING
 * 
 * Creates 20 real bot users with:
 * - Real email addresses
 * - Real passwords
 * - Email verified
 * - Various subscription types
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

interface BotUserConfig {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  subscriptions: Array<{
    package_type: 'pilates' | 'free_gym' | 'ultimate' | 'ultimate_medium';
    start_date: string;
    end_date: string;
  }>;
}

// Create 20 bot users with different subscription types
const botUsers: BotUserConfig[] = [
  // 5 Pilates users
  {
    email: 'bot.pilates.001@test.gym',
    password: 'TestBot@Pilates001!',
    first_name: 'Pilates',
    last_name: 'Bot001',
    subscriptions: [
      { package_type: 'pilates', start_date: '2026-01-01', end_date: '2026-02-28' }
    ]
  },
  {
    email: 'bot.pilates.002@test.gym',
    password: 'TestBot@Pilates002!',
    first_name: 'Pilates',
    last_name: 'Bot002',
    subscriptions: [
      { package_type: 'pilates', start_date: '2026-01-15', end_date: '2026-03-15' }
    ]
  },
  {
    email: 'bot.pilates.003@test.gym',
    password: 'TestBot@Pilates003!',
    first_name: 'Pilates',
    last_name: 'Bot003',
    subscriptions: [
      { package_type: 'pilates', start_date: '2026-01-20', end_date: '2026-03-20' }
    ]
  },
  {
    email: 'bot.pilates.004@test.gym',
    password: 'TestBot@Pilates004!',
    first_name: 'Pilates',
    last_name: 'Bot004',
    subscriptions: [
      { package_type: 'pilates', start_date: '2025-12-15', end_date: '2026-01-31' } // Expires today!
    ]
  },
  {
    email: 'bot.pilates.005@test.gym',
    password: 'TestBot@Pilates005!',
    first_name: 'Pilates',
    last_name: 'Bot005',
    subscriptions: [
      { package_type: 'pilates', start_date: '2026-01-31', end_date: '2026-02-01' } // Expires tomorrow
    ]
  },

  // 5 FreeGym users
  {
    email: 'bot.freegym.001@test.gym',
    password: 'TestBot@FreeGym001!',
    first_name: 'FreeGym',
    last_name: 'Bot001',
    subscriptions: [
      { package_type: 'free_gym', start_date: '2026-01-01', end_date: '2026-03-31' }
    ]
  },
  {
    email: 'bot.freegym.002@test.gym',
    password: 'TestBot@FreeGym002!',
    first_name: 'FreeGym',
    last_name: 'Bot002',
    subscriptions: [
      { package_type: 'free_gym', start_date: '2026-01-15', end_date: '2026-04-15' }
    ]
  },
  {
    email: 'bot.freegym.003@test.gym',
    password: 'TestBot@FreeGym003!',
    first_name: 'FreeGym',
    last_name: 'Bot003',
    subscriptions: [
      { package_type: 'free_gym', start_date: '2025-12-01', end_date: '2026-01-31' } // Expires today
    ]
  },
  {
    email: 'bot.freegym.004@test.gym',
    password: 'TestBot@FreeGym004!',
    first_name: 'FreeGym',
    last_name: 'Bot004',
    subscriptions: [
      { package_type: 'free_gym', start_date: '2026-02-01', end_date: '2026-05-01' }
    ]
  },
  {
    email: 'bot.freegym.005@test.gym',
    password: 'TestBot@FreeGym005!',
    first_name: 'FreeGym',
    last_name: 'Bot005',
    subscriptions: [
      { package_type: 'free_gym', start_date: '2026-01-31', end_date: '2026-02-01' } // Expires tomorrow
    ]
  },

  // 5 Ultimate users (refill every Sunday → 3 lessons)
  {
    email: 'bot.ultimate.001@test.gym',
    password: 'TestBot@Ultimate001!',
    first_name: 'Ultimate',
    last_name: 'Bot001',
    subscriptions: [
      { package_type: 'ultimate', start_date: '2026-01-01', end_date: '2026-12-31' }
    ]
  },
  {
    email: 'bot.ultimate.002@test.gym',
    password: 'TestBot@Ultimate002!',
    first_name: 'Ultimate',
    last_name: 'Bot002',
    subscriptions: [
      { package_type: 'ultimate', start_date: '2026-01-15', end_date: '2026-12-31' }
    ]
  },
  {
    email: 'bot.ultimate.003@test.gym',
    password: 'TestBot@Ultimate003!',
    first_name: 'Ultimate',
    last_name: 'Bot003',
    subscriptions: [
      { package_type: 'ultimate', start_date: '2025-12-01', end_date: '2026-01-31' } // Expires today
    ]
  },
  {
    email: 'bot.ultimate.004@test.gym',
    password: 'TestBot@Ultimate004!',
    first_name: 'Ultimate',
    last_name: 'Bot004',
    subscriptions: [
      { package_type: 'ultimate', start_date: '2026-01-10', end_date: '2027-01-10' }
    ]
  },
  {
    email: 'bot.ultimate.005@test.gym',
    password: 'TestBot@Ultimate005!',
    first_name: 'Ultimate',
    last_name: 'Bot005',
    subscriptions: [
      { package_type: 'ultimate', start_date: '2026-01-31', end_date: '2026-02-01' } // Expires tomorrow
    ]
  },

  // 5 Ultimate Medium users (refill every Sunday → 1 lesson)
  {
    email: 'bot.ultimatemedium.001@test.gym',
    password: 'TestBot@UltimateMedium001!',
    first_name: 'Ultimate Medium',
    last_name: 'Bot001',
    subscriptions: [
      { package_type: 'ultimate_medium', start_date: '2026-01-01', end_date: '2026-12-31' }
    ]
  },
  {
    email: 'bot.ultimatemedium.002@test.gym',
    password: 'TestBot@UltimateMedium002!',
    first_name: 'Ultimate Medium',
    last_name: 'Bot002',
    subscriptions: [
      { package_type: 'ultimate_medium', start_date: '2026-01-15', end_date: '2026-12-31' }
    ]
  },
  {
    email: 'bot.ultimatemedium.003@test.gym',
    password: 'TestBot@UltimateMedium003!',
    first_name: 'Ultimate Medium',
    last_name: 'Bot003',
    subscriptions: [
      { package_type: 'ultimate_medium', start_date: '2025-12-01', end_date: '2026-01-31' } // Expires today
    ]
  },
  {
    email: 'bot.ultimatemedium.004@test.gym',
    password: 'TestBot@UltimateMedium004!',
    first_name: 'Ultimate Medium',
    last_name: 'Bot004',
    subscriptions: [
      { package_type: 'ultimate_medium', start_date: '2026-01-10', end_date: '2027-01-10' }
    ]
  },
  {
    email: 'bot.ultimatemedium.005@test.gym',
    password: 'TestBot@UltimateMedium005!',
    first_name: 'Ultimate Medium',
    last_name: 'Bot005',
    subscriptions: [
      { package_type: 'ultimate_medium', start_date: '2026-01-31', end_date: '2026-02-01' } // Expires tomorrow
    ]
  }
];

async function createBotUsers() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         CREATING BOT TEST USERS (20 users)              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let successCount = 0;
  let failureCount = 0;
  let userIdMap: Map<string, string> = new Map();

  for (const botUser of botUsers) {
    try {
      console.log(`\n📝 Creating user: ${botUser.email}`);

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: botUser.email,
        password: botUser.password,
        email_confirm: true, // Mark email as verified
        user_metadata: {
          first_name: botUser.first_name,
          last_name: botUser.last_name
        }
      });

      if (authError || !authData.user) {
        console.error(`   ❌ Auth error: ${authError?.message}`);
        failureCount++;
        continue;
      }

      const userId = authData.user.id;
      userIdMap.set(botUser.email, userId);
      console.log(`   ✅ Auth user created: ${userId}`);

      // Step 2: Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          email: botUser.email,
          first_name: botUser.first_name,
          last_name: botUser.last_name,
          created_at: new Date().toISOString()
        })
        .select();

      if (profileError) {
        console.error(`   ❌ Profile error: ${profileError.message}`);
        failureCount++;
        continue;
      }

      console.log(`   ✅ User profile created`);

      // Step 3: Get membership package IDs
      const { data: packages } = await supabase
        .from('membership_packages')
        .select('id, name');

      const packageMap: Map<string, string> = new Map();
      packages?.forEach((pkg: any) => {
        if (pkg.name.includes('Pilates')) {
          packageMap.set('pilates', pkg.id);
        } else if (pkg.name.includes('FreeGym') || pkg.name.includes('Free Gym')) {
          packageMap.set('free_gym', pkg.id);
        } else if (pkg.name.includes('Ultimate Medium')) {
          packageMap.set('ultimate_medium', pkg.id);
        } else if (pkg.name.includes('Ultimate')) {
          packageMap.set('ultimate', pkg.id);
        }
      });

      // Step 4: Create memberships
      for (const sub of botUser.subscriptions) {
        const packageId = packageMap.get(sub.package_type);
        if (!packageId) {
          console.warn(`   ⚠️  Package not found for ${sub.package_type}`);
          continue;
        }

        const { error: membershipError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            membership_package_id: packageId,
            start_date: sub.start_date,
            end_date: sub.end_date,
            is_active: true,
            status: 'active',
            created_at: new Date().toISOString()
          });

        if (membershipError) {
          console.error(`   ❌ Membership error: ${membershipError.message}`);
        } else {
          console.log(`   ✅ Membership created: ${sub.package_type} (${sub.start_date} → ${sub.end_date})`);
        }
      }

      successCount++;
    } catch (error: any) {
      console.error(`   ❌ Unexpected error: ${error.message}`);
      failureCount++;
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║              BOT USER CREATION COMPLETE                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Failed: ${failureCount} users\n`);

  console.log('📋 Bot User Credentials:');
  console.log('─'.repeat(60));
  
  botUsers.forEach((user) => {
    console.log(`Email: ${user.email}`);
    console.log(`Pass:  ${user.password}`);
    console.log(`Type:  ${user.subscriptions[0]?.package_type}`);
    console.log('');
  });

  console.log('═'.repeat(60));
  console.log('✅ Bot users ready for testing!');
}

// Run the creation
createBotUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
