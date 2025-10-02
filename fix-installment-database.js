// Script to fix installment database fields
import { createClient } from '@supabase/supabase-js';

// You need to replace these with your actual Supabase credentials
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2MjQ4MDAsImV4cCI6MjA0OTIwMDgwMH0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixInstallmentDatabase() {
  try {
    console.log('🔧 Fixing installment database fields...');
    
    // First, let's check if the fields exist by trying to query them
    console.log('📋 Checking current database structure...');
    
    const { data: testData, error: testError } = await supabase
      .from('membership_requests')
      .select('id, has_installments')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error connecting to database:', testError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Try to add the missing columns using a simple approach
    console.log('🔨 Attempting to add missing columns...');
    
    // We'll use a simple SQL execution approach
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('exec_sql', {
        sql: `
          ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_1_locked BOOLEAN DEFAULT false;
          ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_2_locked BOOLEAN DEFAULT false;
          ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_3_locked BOOLEAN DEFAULT false;
          ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS third_installment_deleted BOOLEAN DEFAULT false;
          ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS third_installment_deleted_at TIMESTAMPTZ;
          ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS third_installment_deleted_by UUID REFERENCES user_profiles(id);
        `
      });
    
    if (sqlError) {
      console.error('❌ Error executing SQL:', sqlError);
      console.log('💡 You may need to run the SQL script manually in the Supabase Dashboard');
      return;
    }
    
    console.log('✅ SQL executed successfully:', sqlResult);
    
    // Now test if the fields exist
    console.log('🧪 Testing if fields were added...');
    
    const { data: testFields, error: fieldsError } = await supabase
      .from('membership_requests')
      .select('id, installment_1_locked, installment_2_locked, installment_3_locked, third_installment_deleted')
      .limit(1);
    
    if (fieldsError) {
      console.error('❌ Error testing fields:', fieldsError);
      return;
    }
    
    console.log('✅ Fields test successful:', testFields);
    console.log('🎉 Installment database fix completed!');
    
  } catch (error) {
    console.error('💥 Exception:', error);
  }
}

fixInstallmentDatabase();
