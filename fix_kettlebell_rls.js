import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixKettlebellRLS() {
  console.log('🔧 Fixing Kettlebell Points RLS policies...\n');

  try {
    // First, let's try to disable RLS temporarily
    console.log('1️⃣ Attempting to disable RLS temporarily...');
    
    // Try to insert data with RLS disabled (this might not work with anon key)
    const { data: insertData, error: insertError } = await supabase
      .from('user_kettlebell_points')
      .insert([{
        user_id: '00000000-0000-0000-0000-000000000002',
        points: 50,
        program_id: null,
        created_by: '00000000-0000-0000-0000-000000000002'
      }])
      .select();

    if (insertError) {
      console.error('❌ Error inserting with current RLS:', insertError);
      
      // The error suggests we need admin access
      console.log('\n2️⃣ RLS is blocking access. This is expected with anon key.');
      console.log('💡 The issue is that the RLS policies require admin role, but we need admin authentication.');
      console.log('💡 The data you see in the images must be from a different environment or with admin auth.');
      
      // Let's check if we can read existing data
      console.log('\n3️⃣ Checking if we can read existing data...');
      const { data: readData, error: readError } = await supabase
        .from('user_kettlebell_points')
        .select('*')
        .limit(5);

      if (readError) {
        console.error('❌ Error reading data:', readError);
      } else {
        console.log('✅ Can read data:', readData?.length || 0, 'records');
        console.log('📊 Data:', readData);
      }
      
    } else {
      console.log('✅ Successfully inserted data:', insertData);
    }

    // Let's also check the current user context
    console.log('\n4️⃣ Checking current user context...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ No authenticated user:', userError.message);
      console.log('💡 This explains why RLS is blocking - no user context');
    } else {
      console.log('✅ Current user:', user?.email);
    }

  } catch (error) {
    console.error('❌ Exception during RLS fix:', error);
  }
}

// Run the fix
fixKettlebellRLS();
