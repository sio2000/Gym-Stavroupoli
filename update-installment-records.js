// Script to update existing installment records with locked fields
import { createClient } from '@supabase/supabase-js';

// You need to replace these with your actual Supabase credentials
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2MjQ4MDAsImV4cCI6MjA0OTIwMDgwMH0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateInstallmentRecords() {
  try {
    console.log('🔧 Updating installment records...');
    
    // First, let's see what we have
    const { data: requests, error: fetchError } = await supabase
      .from('membership_requests')
      .select('id, has_installments, package_id')
      .eq('has_installments', true)
      .limit(10);
    
    if (fetchError) {
      console.error('❌ Error fetching requests:', fetchError);
      return;
    }
    
    console.log('📋 Found', requests.length, 'installment requests');
    console.log('Sample requests:', requests);
    
    // Try to update one record to see if the fields exist
    if (requests.length > 0) {
      const testRequest = requests[0];
      console.log('🧪 Testing update on request:', testRequest.id);
      
      const { data: updateData, error: updateError } = await supabase
        .from('membership_requests')
        .update({
          installment_1_locked: false,
          installment_2_locked: false,
          installment_3_locked: false,
          third_installment_deleted: false
        })
        .eq('id', testRequest.id)
        .select();
      
      if (updateError) {
        console.error('❌ Error updating record:', updateError);
        console.log('💡 This suggests the columns do not exist in the database');
        console.log('🔧 You need to run the SQL script in the Supabase Dashboard first');
        return;
      }
      
      console.log('✅ Update successful:', updateData);
    }
    
  } catch (error) {
    console.error('💥 Exception:', error);
  }
}

updateInstallmentRecords();
