// Test script to check if RLS is causing the 406 errors
const { createClient } = require('@supabase/supabase-js');

// Use the regular supabase client (not admin)
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLS() {
  try {
    console.log('Testing RLS access...');
    
    // Test query to user_old_members_usage
    const { data, error } = await supabase
      .from('user_old_members_usage')
      .select('user_id')
      .limit(5);
    
    if (error) {
      console.error('Error accessing user_old_members_usage:', error);
    } else {
      console.log('Successfully accessed user_old_members_usage:', data);
    }
    
    // Test query to user_kettlebell_points
    const { data: data2, error: error2 } = await supabase
      .from('user_kettlebell_points')
      .select('user_id')
      .limit(5);
    
    if (error2) {
      console.error('Error accessing user_kettlebell_points:', error2);
    } else {
      console.log('Successfully accessed user_kettlebell_points:', data2);
    }
    
  } catch (error) {
    console.error('Exception during test:', error);
  }
}

testRLS();
