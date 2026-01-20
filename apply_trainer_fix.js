// Script to fix trainer schedules for Mike and Jordan
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyTrainerFix() {
  console.log('🔧 Applying trainer schedules fix to Supabase...');

  try {
    // Read the SQL fix file
    const sqlFix = fs.readFileSync('database/FIX_TRAINER_SCHEDULES.sql', 'utf8');

    console.log('📄 SQL fix file loaded');

    // Split the SQL into individual statements (by semicolon)
    const statements = sqlFix
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n${i + 1}. Executing: ${statement.substring(0, 50)}...`);

        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

          if (error) {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message);
            console.error('Statement:', statement);
            continue;
          }

          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (rpcError) {
          console.error(`❌ RPC Error executing statement ${i + 1}:`, rpcError.message);
          console.error('Statement:', statement);
          continue;
        }
      }
    }

    console.log('\n🎉 All SQL statements executed!');
    console.log('🔍 Checking results...');

    // Check the results
    const { data: schedules, error: checkError } = await supabase
      .from('personal_training_schedules')
      .select('id, trainer_name, schedule_data')
      .limit(10);

    if (checkError) {
      console.error('❌ Error checking results:', checkError);
    } else {
      console.log('✅ Sample schedules after fix:');
      schedules?.forEach((schedule, index) => {
        console.log(`${index + 1}. Trainer: ${schedule.trainer_name}, Sessions: ${schedule.schedule_data?.sessions?.length || 0}`);
      });
    }

  } catch (error) {
    console.error('❌ Error applying trainer fix:', error);
  }
}

applyTrainerFix();