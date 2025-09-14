// Script to apply the manual update function
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client with service key for admin access
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyManualUpdateFunction() {
  console.log('🔧 Applying manual update function...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'create_manual_update_function.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL content:');
    console.log(sqlContent);
    
    // Apply the SQL
    const { data, error } = await supabase
      .rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ Error applying SQL:', error);
      return;
    }

    console.log('✅ Manual update function applied successfully!');
    
    // Test the function
    console.log('\n🧪 Testing the function...');
    
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

    // Test the function
    const { error: functionError } = await supabase
      .rpc('update_lesson_deposit_manual', {
        p_user_id: testUser.user_id,
        p_used_lessons: 2
      });

    if (functionError) {
      console.error('❌ Function test failed:', functionError);
      return;
    }

    console.log('✅ Function test successful!');

    // Check the result
    const { data: updatedDeposit, error: checkError } = await supabase
      .from('lesson_deposits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    if (checkError) {
      console.error('❌ Error checking updated deposit:', checkError);
      return;
    }

    console.log('📊 Updated deposit:', {
      total: updatedDeposit.total_lessons,
      used: updatedDeposit.used_lessons,
      remaining: updatedDeposit.remaining_lessons
    });

    // Cleanup
    await supabase.from('lesson_deposits').delete().eq('user_id', testUser.user_id);
    console.log('✅ Cleanup completed');

    console.log('\n🎉 Manual update function is ready!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
applyManualUpdateFunction();
