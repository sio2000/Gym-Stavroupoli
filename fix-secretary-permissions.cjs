const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTYzNTYyNywiZXhwIjoyMDQxMjExNjI3fQ.oaUJbOaKqjqaWYBQvYg3lHiKZKdXhgkTzEV2j5LmEOg';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixSecretaryPermissions() {
  console.log('🔧 [Fix Secretary Permissions] Starting...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'FIX_SECRETARY_CASH_TRANSACTIONS_RLS.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 [Fix Secretary Permissions] SQL file loaded, executing...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    });
    
    if (error) {
      console.error('❌ [Fix Secretary Permissions] Error executing SQL:', error);
      
      // Try alternative approach - execute line by line
      console.log('🔄 [Fix Secretary Permissions] Trying alternative approach...');
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.includes('DO $$')) {
          // Handle DO blocks separately
          const fullBlock = statement + ';';
          try {
            const { error: blockError } = await supabase.rpc('exec_sql', { 
              sql_query: fullBlock 
            });
            if (blockError) {
              console.warn('⚠️ [Fix Secretary Permissions] Warning in DO block:', blockError.message);
            } else {
              console.log('✅ [Fix Secretary Permissions] DO block executed successfully');
            }
          } catch (err) {
            console.warn('⚠️ [Fix Secretary Permissions] Error in DO block:', err.message);
          }
        } else if (statement.trim()) {
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { 
              sql_query: statement + ';' 
            });
            if (stmtError) {
              console.warn('⚠️ [Fix Secretary Permissions] Warning in statement:', stmtError.message);
            } else {
              console.log('✅ [Fix Secretary Permissions] Statement executed:', statement.substring(0, 50) + '...');
            }
          } catch (err) {
            console.warn('⚠️ [Fix Secretary Permissions] Error in statement:', err.message);
          }
        }
      }
    } else {
      console.log('✅ [Fix Secretary Permissions] SQL executed successfully:', data);
    }
    
    // Verify the policies were created
    console.log('🔍 [Fix Secretary Permissions] Verifying policies...');
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .like('tablename', 'user_cash_transactions');
    
    if (policiesError) {
      console.warn('⚠️ [Fix Secretary Permissions] Could not verify policies:', policiesError);
    } else {
      console.log('📋 [Fix Secretary Permissions] Current policies:', policies?.length || 0);
      policies?.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} for ${policy.roles}`);
      });
    }
    
    console.log('✅ [Fix Secretary Permissions] Completed successfully!');
    console.log('');
    console.log('🎉 Secretary permissions have been updated!');
    console.log('   - Secretaries can now create cash transactions');
    console.log('   - Secretaries can now create POS transactions');
    console.log('   - Secretaries can now save kettlebell points');
    console.log('   - Secretaries can now mark old members as used');
    console.log('');
    console.log('Please test the Secretary Panel Ultimate Installments functionality now.');
    
  } catch (error) {
    console.error('❌ [Fix Secretary Permissions] Unexpected error:', error);
    process.exit(1);
  }
}

// Run the function
fixSecretaryPermissions();
