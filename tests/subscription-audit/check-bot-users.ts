import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co',
  process.env.VITE_SUPABASE_SERVICE_KEY || ''
);

async function main() {
  try {
    // Get all bot profiles
    console.log('🔍 Checking bot profiles...\n');
    
    const { data: botProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, email, first_name, last_name')
      .or(`email.ilike.%bot.%,email.ilike.%.test.gym%`);

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return;
    }

    console.log(`✅ Bot profiles: ${botProfiles?.length || 0}`);
    botProfiles?.slice(0, 10).forEach(p => {
      console.log(`   - ${p.first_name} ${p.last_name} (${p.email})`);
    });

    // Get all memberships
    console.log('\n🔍 Checking memberships for bot users...\n');
    
    const { data: allMemberships, error: memError } = await supabase
      .from('memberships')
      .select('id, user_id, status, start_date, end_date, package_id');

    if (memError) {
      console.error('❌ Membership error:', memError.message);
      return;
    }

    const botUserIds = new Set(botProfiles?.map(p => p.user_id) || []);
    const botMemberships = allMemberships?.filter(m => botUserIds.has(m.user_id)) || [];

    console.log(`Total memberships in system: ${allMemberships?.length}`);
    console.log(`Bot memberships: ${botMemberships.length}`);

    if (botMemberships.length > 0) {
      console.log('\n✅ Sample bot memberships:');
      botMemberships.slice(0, 10).forEach(m => {
        const profile = botProfiles?.find(p => p.user_id === m.user_id);
        console.log(`   - ${profile?.first_name} ${profile?.last_name}: ${m.status} (${m.start_date} → ${m.end_date})`);
      });
    } else {
      console.log('\n⚠️ ERROR: Bot users exist but have NO memberships!');
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Bot Auth Users: ${botProfiles?.length || 0}`);
    console.log(`   Bot Memberships: ${botMemberships.length}`);

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

main();
