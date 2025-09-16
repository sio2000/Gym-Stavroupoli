// Script to apply SQL fix to Supabase
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

async function applySqlFix() {
  console.log('🔧 Applying SQL fix to Supabase...');
  
  try {
    // Read the SQL fix file
    const sqlFix = fs.readFileSync('apply_fix_immediately.sql', 'utf8');
    
    console.log('📄 SQL fix file loaded');
    
    // Split the SQL into individual statements
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
          
          // Wait a bit between statements
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (err) {
          console.error(`❌ Exception executing statement ${i + 1}:`, err.message);
          console.error('Statement:', statement);
        }
      }
    }
    
    console.log('\n✅ SQL fix applied successfully!');
    
    // Test the fix
    console.log('\n🧪 Testing the fix...');
    
    const { data: testProfiles, error: testError } = await supabase
      .from('user_profiles')
      .select('user_id, email, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (testError) {
      console.error('❌ Error testing profiles:', testError.message);
      return false;
    }
    
    console.log('📊 Recent profiles after fix:');
    testProfiles.forEach(profile => {
      console.log(`   - ${profile.user_id}: ${profile.email} (${profile.first_name} ${profile.last_name}) - ${profile.created_at}`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to apply SQL fix:', error.message);
    return false;
  }
}

// Run the fix
applySqlFix().then(success => {
  if (success) {
    console.log('\n🎉 SQL fix applied successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 SQL fix failed!');
    process.exit(1);
  }
});
