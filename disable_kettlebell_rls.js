import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLS() {
  console.log('🔧 Disabling RLS for user_kettlebell_points...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('database/disable_kettlebell_rls.sql', 'utf8');
    console.log('📄 SQL content loaded');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      console.log(`${i + 1}️⃣ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          if (data) {
            console.log('📊 Result:', data);
          }
        }
      } catch (err) {
        console.error(`❌ Exception executing statement ${i + 1}:`, err);
      }
    }
    
  } catch (error) {
    console.error('❌ Exception during RLS disable:', error);
    console.log('💡 You may need to apply the SQL directly in Supabase dashboard');
  }
}

disableRLS();
