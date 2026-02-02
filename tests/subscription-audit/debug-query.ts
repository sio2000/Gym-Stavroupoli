import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co',
  process.env.VITE_SUPABASE_SERVICE_KEY || ''
);

async function debug() {
  console.log('🔍 Testing exact query from test...\n');
  
  // Exact query from test
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('user_id, email, first_name, last_name');

  console.log('Error:', error?.message);
  console.log('Total returned:', users?.length);
  
  if (users && users.length > 0) {
    console.log('\n✅ Sample data:');
    users.slice(0, 5).forEach(u => {
      console.log(`   - ${u.first_name} ${u.last_name}: email=${u.email}`);
    });

    const botUsers = users.filter(u => 
      u.email?.includes('bot.') || 
      u.first_name?.includes('Bot') ||
      u.last_name?.includes('Bot')
    );
    console.log(`\n🤖 Bot users found: ${botUsers.length}`);
  }
}

debug();
