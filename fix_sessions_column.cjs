const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY; // Use service key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSessionsColumn() {
  console.log('🔧 Fixing missing sessions column...\n');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('fix_sessions_column.sql', 'utf8');
    console.log('📄 SQL content loaded');

    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔨 Executing statement ${i + 1}/${statements.length}:`);
      console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with next statement
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          if (data) {
            console.log('📊 Result:', data);
          }
        }
      } catch (err) {
        console.error(`❌ Exception executing statement ${i + 1}:`, err.message);
        // Continue with next statement
      }
    }

    // Verify the column exists
    console.log('\n🔍 Verifying column was added...');
    const { data: columns, error: columnError } = await supabase
      .from('personal_training_schedules')
      .select('*')
      .limit(1);

    if (columnError) {
      console.error('❌ Error verifying column:', columnError);
    } else {
      console.log('✅ Column verification successful');
      if (columns && columns.length > 0) {
        const sampleRecord = columns[0];
        if ('sessions' in sampleRecord) {
          console.log('✅ sessions column exists in the table');
          console.log('📊 Sample sessions value:', sampleRecord.sessions);
        } else {
          console.log('❌ sessions column still missing');
        }
      }
    }

    console.log('\n🎉 Fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixSessionsColumn();
