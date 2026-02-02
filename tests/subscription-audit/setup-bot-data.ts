/**
 * CREATE PROFILES AND MEMBERSHIPS FOR EXISTING BOT USERS
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

interface BotMembership {
  email: string;
  first_name: string;
  last_name: string;
  package_type: 'pilates' | 'free_gym' | 'ultimate' | 'ultimate_medium';
  start_date: string;
  end_date: string;
}

const botMemberships: BotMembership[] = [
  // 5 Pilates users
  { email: 'bot.pilates.001@test.gym', first_name: 'Pilates', last_name: 'Bot001', package_type: 'pilates', start_date: '2026-01-01', end_date: '2026-02-28' },
  { email: 'bot.pilates.002@test.gym', first_name: 'Pilates', last_name: 'Bot002', package_type: 'pilates', start_date: '2026-01-15', end_date: '2026-03-15' },
  { email: 'bot.pilates.003@test.gym', first_name: 'Pilates', last_name: 'Bot003', package_type: 'pilates', start_date: '2026-01-20', end_date: '2026-03-20' },
  { email: 'bot.pilates.004@test.gym', first_name: 'Pilates', last_name: 'Bot004', package_type: 'pilates', start_date: '2025-12-15', end_date: '2026-01-31' },
  { email: 'bot.pilates.005@test.gym', first_name: 'Pilates', last_name: 'Bot005', package_type: 'pilates', start_date: '2026-01-31', end_date: '2026-02-01' },

  // 5 FreeGym users
  { email: 'bot.freegym.001@test.gym', first_name: 'FreeGym', last_name: 'Bot001', package_type: 'free_gym', start_date: '2026-01-01', end_date: '2026-03-31' },
  { email: 'bot.freegym.002@test.gym', first_name: 'FreeGym', last_name: 'Bot002', package_type: 'free_gym', start_date: '2026-01-15', end_date: '2026-04-15' },
  { email: 'bot.freegym.003@test.gym', first_name: 'FreeGym', last_name: 'Bot003', package_type: 'free_gym', start_date: '2025-12-01', end_date: '2026-01-31' },
  { email: 'bot.freegym.004@test.gym', first_name: 'FreeGym', last_name: 'Bot004', package_type: 'free_gym', start_date: '2026-02-01', end_date: '2026-05-01' },
  { email: 'bot.freegym.005@test.gym', first_name: 'FreeGym', last_name: 'Bot005', package_type: 'free_gym', start_date: '2026-01-31', end_date: '2026-02-01' },

  // 5 Ultimate users
  { email: 'bot.ultimate.001@test.gym', first_name: 'Ultimate', last_name: 'Bot001', package_type: 'ultimate', start_date: '2026-01-01', end_date: '2026-12-31' },
  { email: 'bot.ultimate.002@test.gym', first_name: 'Ultimate', last_name: 'Bot002', package_type: 'ultimate', start_date: '2026-01-15', end_date: '2026-12-31' },
  { email: 'bot.ultimate.003@test.gym', first_name: 'Ultimate', last_name: 'Bot003', package_type: 'ultimate', start_date: '2025-12-01', end_date: '2026-01-31' },
  { email: 'bot.ultimate.004@test.gym', first_name: 'Ultimate', last_name: 'Bot004', package_type: 'ultimate', start_date: '2026-01-10', end_date: '2027-01-10' },
  { email: 'bot.ultimate.005@test.gym', first_name: 'Ultimate', last_name: 'Bot005', package_type: 'ultimate', start_date: '2026-01-31', end_date: '2026-02-01' },

  // 5 Ultimate Medium users
  { email: 'bot.ultimatemedium.001@test.gym', first_name: 'Ultimate Medium', last_name: 'Bot001', package_type: 'ultimate_medium', start_date: '2026-01-01', end_date: '2026-12-31' },
  { email: 'bot.ultimatemedium.002@test.gym', first_name: 'Ultimate Medium', last_name: 'Bot002', package_type: 'ultimate_medium', start_date: '2026-01-15', end_date: '2026-12-31' },
  { email: 'bot.ultimatemedium.003@test.gym', first_name: 'Ultimate Medium', last_name: 'Bot003', package_type: 'ultimate_medium', start_date: '2025-12-01', end_date: '2026-01-31' },
  { email: 'bot.ultimatemedium.004@test.gym', first_name: 'Ultimate Medium', last_name: 'Bot004', package_type: 'ultimate_medium', start_date: '2026-01-10', end_date: '2027-01-10' },
  { email: 'bot.ultimatemedium.005@test.gym', first_name: 'Ultimate Medium', last_name: 'Bot005', package_type: 'ultimate_medium', start_date: '2026-01-31', end_date: '2026-02-01' }
];

async function setupProfiles() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║    SETTING UP PROFILES & MEMBERSHIPS FOR BOT USERS      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let successCount = 0;
  let failureCount = 0;

  // Get all existing users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError || !users) {
    console.error('Failed to list users:', usersError?.message);
    process.exit(1);
  }

  console.log(`Found ${users.length} users in auth\n`);

  // Get membership packages
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

  console.log(`Found ${packages?.length || 0} membership packages`);
  console.log(`Package map:`, packageMap, '\n');

  for (const botMem of botMemberships) {
    try {
      // Find user by email
      const user = users.find((u: any) => u.email === botMem.email);
      
      if (!user) {
        console.log(`⚠️  User not found: ${botMem.email}`);
        failureCount++;
        continue;
      }

      const userId = user.id;
      console.log(`📝 Setting up: ${botMem.email} (${botMem.package_type})`);

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (!existingProfile) {
        // Create profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            email: botMem.email,
            first_name: botMem.first_name,
            last_name: botMem.last_name,
            created_at: new Date().toISOString()
          });

        if (profileError) {
          console.error(`   ❌ Profile error: ${profileError.message}`);
          failureCount++;
          continue;
        }
        console.log(`   ✅ Profile created`);
      } else {
        console.log(`   ℹ️  Profile already exists`);
      }

      // Check if membership exists
      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingMembership) {
        const packageId = packageMap.get(botMem.package_type);
        
        if (!packageId) {
          console.error(`   ❌ Package ID not found for ${botMem.package_type}`);
          failureCount++;
          continue;
        }

        // Create membership
        const { error: membershipError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            package_id: packageId,
            start_date: botMem.start_date,
            end_date: botMem.end_date,
            is_active: true,
            status: 'active',
            created_at: new Date().toISOString()
          });

        if (membershipError) {
          console.error(`   ❌ Membership error: ${membershipError.message}`);
          failureCount++;
          continue;
        }
        console.log(`   ✅ Membership created: ${botMem.start_date} → ${botMem.end_date}`);
      } else {
        console.log(`   ℹ️  Membership already exists`);
      }

      successCount++;
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      failureCount++;
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║            SETUP COMPLETE - BOT USERS READY            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Successfully set up: ${successCount} users`);
  console.log(`❌ Failed: ${failureCount} users\n`);
}

setupProfiles().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
