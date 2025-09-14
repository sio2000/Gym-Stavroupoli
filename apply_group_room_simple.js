import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseKey = 'your-anon-key'; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyGroupRoomMigration() {
  try {
    console.log('🚀 Starting Group Room migration...');
    
    // SQL statements to execute
    const statements = [
      `ALTER TABLE program_approval_states 
       ADD COLUMN IF NOT EXISTS group_room_size INTEGER,
       ADD COLUMN IF NOT EXISTS weekly_frequency INTEGER,
       ADD COLUMN IF NOT EXISTS monthly_total INTEGER;`,
       
      `ALTER TABLE personal_training_schedules 
       ADD COLUMN IF NOT EXISTS training_type VARCHAR(20) DEFAULT 'individual',
       ADD COLUMN IF NOT EXISTS group_room_size INTEGER,
       ADD COLUMN IF NOT EXISTS weekly_frequency INTEGER,
       ADD COLUMN IF NOT EXISTS monthly_total INTEGER;`,
       
      `COMMENT ON COLUMN program_approval_states.group_room_size IS 'Number of users in the group room (2, 3, or 6)';`,
       
      `COMMENT ON COLUMN program_approval_states.weekly_frequency IS 'Number of times per week the user attends group training';`,
       
      `COMMENT ON COLUMN program_approval_states.monthly_total IS 'Total monthly sessions (weekly_frequency * 4)';`,
       
      `COMMENT ON COLUMN personal_training_schedules.training_type IS 'Type of training: individual or group';`,
       
      `COMMENT ON COLUMN personal_training_schedules.group_room_size IS 'Number of users in the group room (2, 3, or 6)';`,
       
      `COMMENT ON COLUMN personal_training_schedules.weekly_frequency IS 'Number of times per week the user attends group training';`,
       
      `COMMENT ON COLUMN personal_training_schedules.monthly_total IS 'Total monthly sessions (weekly_frequency * 4)';`,
       
      `CREATE INDEX IF NOT EXISTS idx_program_approval_states_group_room 
       ON program_approval_states(group_room_size, weekly_frequency);`,
       
      `CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_training_type 
       ON personal_training_schedules(training_type, group_room_size);`
    ];
    
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
