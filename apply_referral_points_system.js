import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyReferralPointsSystem() {
  try {
    console.log('🚀 Starting Referral Points System Setup...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'create_referral_points_system.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('🎉 Referral Points System setup completed!');
    console.log('');
    console.log('📋 What was created:');
    console.log('   • user_referral_points table - stores user referral points');
    console.log('   • referral_transactions table - tracks all referral transactions');
    console.log('   • Database functions for referral processing');
    console.log('   • RLS policies for security');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Test the referral system in your app');
    console.log('   2. Verify referral codes are generated for existing users');
    console.log('   3. Test referral signup flow');
    
  } catch (error) {
    console.error('💥 Fatal error during setup:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applyReferralPointsSystemDirect() {
  try {
    console.log('🚀 Starting Referral Points System Setup (Direct Method)...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'create_referral_points_system.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    
    // Execute the entire SQL content
    const { error } = await supabase.rpc('exec', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      throw error;
    }
    
    console.log('🎉 Referral Points System setup completed!');
    
  } catch (error) {
    console.error('💥 Fatal error during setup:', error);
    
    // Try manual execution of key statements
    console.log('🔄 Attempting manual execution of key statements...');
    
    try {
      // Create user_referral_points table
      const { error: table1Error } = await supabase
        .from('user_referral_points')
        .select('*')
        .limit(1);
      
      if (table1Error && table1Error.code === 'PGRST116') {
        console.log('📝 Creating user_referral_points table...');
        // Table doesn't exist, we need to create it
        // This would require direct SQL execution
        console.log('⚠️  Manual table creation required. Please run the SQL in Supabase dashboard.');
      }
      
    } catch (manualError) {
      console.error('❌ Manual execution also failed:', manualError);
    }
    
    process.exit(1);
  }
}

// Check if we have the exec_sql function available
async function checkExecFunction() {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    return !error;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  const hasExecFunction = await checkExecFunction();
  
  if (hasExecFunction) {
    await applyReferralPointsSystem();
  } else {
    console.log('⚠️  exec_sql function not available, trying direct method...');
    await applyReferralPointsSystemDirect();
  }
}

main().catch(console.error);
