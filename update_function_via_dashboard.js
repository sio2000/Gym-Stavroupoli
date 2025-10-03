import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nolqodpfaqdnprixaqlo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0'
);

async function testCurrentFunction() {
  console.log('=== ECHO: Testing Current Function ===');
  
  try {
    // Test with NULL value
    console.log('1. Testing with NULL value...');
    const { data: nullResult, error: nullError } = await supabase
      .rpc('delete_third_installment_permanently', { 
        p_request_id: '917c2d9f-ce3e-49da-85ba-78e557783ea7', 
        p_deleted_by: null 
      });
    
    console.log('NULL test result:', JSON.stringify(nullResult, null, 2));
    if (nullError) console.log('NULL test error:', JSON.stringify(nullError, null, 2));
    
    // Test with valid user
    console.log('\n2. Testing with valid user...');
    const { data: userResult, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (userResult && userResult.length > 0) {
      const userId = userResult[0].id;
      console.log('Using user ID:', userId);
      
      const { data: deleteResult, error: deleteError } = await supabase
        .rpc('delete_third_installment_permanently', { 
          p_request_id: 'e4cd6a8f-ec69-4ea3-87d6-61d7582d0a5a', 
          p_deleted_by: userId 
        });
      
      console.log('Delete test result:', JSON.stringify(deleteResult, null, 2));
      if (deleteError) console.log('Delete test error:', JSON.stringify(deleteError, null, 2));
    }
    
    // Check current data
    console.log('\n3. Checking current data...');
    const { data: currentData, error: currentError } = await supabase
      .from('membership_requests')
      .select('id, installment_3_locked, third_installment_deleted, third_installment_deleted_by')
      .in('id', ['e4cd6a8f-ec69-4ea3-87d6-61d7582d0a5a', '917c2d9f-ce3e-49da-85ba-78e557783ea7']);
    
    console.log('Current data:', JSON.stringify(currentData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCurrentFunction();
