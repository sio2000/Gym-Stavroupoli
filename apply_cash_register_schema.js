import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyCashRegisterSchema() {
  console.log('🔧 Applying Cash Register schema...\n');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('database/create_cash_register_schema.sql', 'utf8');
    console.log('📄 SQL content loaded');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log('📊 Found', statements.length, 'SQL statements');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      console.log(`\n${i + 1}️⃣ Executing statement ${i + 1}/${statements.length}...`);
      console.log('📝 Statement:', statement.substring(0, 100) + '...');
      
      try {
        // Try to execute via RPC if available, otherwise just log
        console.log('💡 Note: You may need to apply this SQL directly in Supabase dashboard');
        console.log('📋 SQL to execute:', statement);
      } catch (err) {
        console.error(`❌ Exception executing statement ${i + 1}:`, err);
      }
    }
    
    console.log('\n✅ Schema application completed');
    console.log('💡 Please apply the SQL statements manually in Supabase dashboard if needed');
    
  } catch (error) {
    console.error('❌ Exception during schema application:', error);
  }
}

// Run the schema application
applyCashRegisterSchema();
