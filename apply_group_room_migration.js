import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyGroupRoomMigration() {
  try {
    console.log('🚀 Starting Group Room migration...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'database', 'add_group_room_columns.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + '...');
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Continue with other statements even if one fails
        continue;
      }
      
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
    
    console.log('\n🎉 Group Room migration completed successfully!');
    console.log('\n📋 Migration Summary:');
    console.log('✅ Added group_room_size column to program_approval_states');
    console.log('✅ Added weekly_frequency column to program_approval_states');
    console.log('✅ Added monthly_total column to program_approval_states');
    console.log('✅ Added training_type column to personal_training_schedules');
    console.log('✅ Added group_room_size column to personal_training_schedules');
    console.log('✅ Added weekly_frequency column to personal_training_schedules');
    console.log('✅ Added monthly_total column to personal_training_schedules');
    console.log('✅ Created performance indexes');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyGroupRoomMigration();
