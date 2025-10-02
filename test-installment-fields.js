// Test script to check if installment fields exist in database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2MjQ4MDAsImV4cCI6MjA0OTIwMDgwMH0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInstallmentFields() {
  try {
    console.log('Testing installment fields in membership_requests table...');
    
    // Try to select a few records with installment fields
    const { data, error } = await supabase
      .from('membership_requests')
      .select('id, has_installments, installment_1_locked, installment_2_locked, installment_3_locked, third_installment_deleted')
      .limit(5);
    
    if (error) {
      console.error('Error querying membership_requests:', error);
      return;
    }
    
    console.log('Query successful! Found', data.length, 'records');
    console.log('Sample data:', JSON.stringify(data, null, 2));
    
    // Check if any records have installment fields set
    const hasInstallmentFields = data.some(record => 
      record.installment_1_locked !== undefined || 
      record.installment_2_locked !== undefined || 
      record.installment_3_locked !== undefined ||
      record.third_installment_deleted !== undefined
    );
    
    console.log('Has installment fields:', hasInstallmentFields);
    
  } catch (error) {
    console.error('Exception:', error);
  }
}

testInstallmentFields();
