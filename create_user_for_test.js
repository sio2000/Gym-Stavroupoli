import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nolqodpfaqdnprixaqlo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0'
);

async function createUserAndTest() {
  console.log('=== ECHO: Creating User and Testing ===');
  
  try {
    // Get a user from user_profiles
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .limit(1);
    
    if (profileError || !userProfile || userProfile.length === 0) {
      console.error('Error getting user profile:', profileError);
      return;
    }
    
    const userId = userProfile[0].id;
    const userEmail = userProfile[0].email;
    
    console.log('Using user from user_profiles:', userId, userEmail);
    
    // Create the same user in users table
    console.log('Creating user in users table...');
    const { data: userResult, error: userError } = await supabase
      .from('users')
      .insert({ 
        id: userId, 
        email: userEmail, 
        created_at: new Date().toISOString() 
      });
    
    if (userError) {
      console.log('User creation error (might already exist):', userError.message);
    } else {
      console.log('User created successfully');
    }
    
    // Now test the delete function
    console.log('\nTesting delete function...');
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('delete_third_installment_permanently', { 
        p_request_id: 'e4cd6a8f-ec69-4ea3-87d6-61d7582d0a5a', 
        p_deleted_by: userId 
      });
    
    console.log('Delete function result:', JSON.stringify(deleteResult, null, 2));
    if (deleteError) {
      console.log('Delete function error:', JSON.stringify(deleteError, null, 2));
    }
    
    // Check updated data
    console.log('\nChecking updated data...');
    const { data: updatedData, error: updatedError } = await supabase
      .from('membership_requests')
      .select('id, installment_3_locked, third_installment_deleted, third_installment_deleted_by')
      .eq('id', 'e4cd6a8f-ec69-4ea3-87d6-61d7582d0a5a');
    
    console.log('Updated request:', JSON.stringify(updatedData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createUserAndTest();
