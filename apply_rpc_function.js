// Script to apply the RPC function via Supabase dashboard
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRPCFunction() {
  console.log('🔧 Applying RPC function for manual update...\n');

  try {
    // Read the SQL file
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const sqlPath = path.join(__dirname, 'database', 'create_manual_update_rpc.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL content:');
    console.log(sqlContent);
    
    console.log('\n⚠️  Please apply this SQL manually in the Supabase SQL Editor:');
    console.log('1. Go to https://supabase.com/dashboard/project/nolqodpfaqdnprixaqlo/sql');
    console.log('2. Copy and paste the SQL above');
    console.log('3. Click "Run"');
    
    // Test the function if it exists
    console.log('\n🧪 Testing RPC function...');
    
    // Get a test user
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found for testing');
      return;
    }

    const testUser = users[0];
    console.log(`👤 Using test user: ${testUser.first_name} ${testUser.last_name} (${testUser.user_id})`);

    // Create test deposit
    const { data: depositData, error: depositError } = await supabase
      .from('lesson_deposits')
      .upsert({
        user_id: testUser.user_id,
        total_lessons: 5,
        used_lessons: 0,
        created_by: testUser.user_id
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (depositError) {
      console.error('❌ Error creating test deposit:', depositError);
      return;
    }

    console.log('✅ Test deposit created:', {
      total: depositData.total_lessons,
      used: depositData.used_lessons,
      remaining: depositData.remaining_lessons
    });

    // Test the RPC function
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('update_lesson_deposit_manual', {
        p_user_id: testUser.user_id,
        p_used_lessons: 3
      });

    if (rpcError) {
      console.error('❌ RPC function test failed:', rpcError);
      console.log('⚠️  Please apply the SQL first in Supabase dashboard');
    } else {
      console.log('✅ RPC function test successful!');
      console.log('📊 Updated deposit:', rpcResult);
    }

    // Cleanup
    await supabase.from('lesson_deposits').delete().eq('user_id', testUser.user_id);
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
applyRPCFunction();
