// Test database connection and RLS
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('Testing database connection...');
  
  try {
    // Test 1: Check if we can read from user_metrics
    console.log('\n1. Testing READ from user_metrics...');
    const { data: readData, error: readError } = await supabase
      .from('user_metrics')
      .select('*')
      .limit(5);
      
    if (readError) {
      console.error('READ Error:', readError);
    } else {
      console.log('READ Success:', readData?.length || 0, 'records found');
    }
    
    // Test 2: Check if we can insert into user_metrics
    console.log('\n2. Testing INSERT into user_metrics...');
    const testPayload = {
      user_id: 'dcfce45b-8418-4cb3-b81d-762a7575d8d4', // Real user ID from logs
      metric_date: new Date().toISOString().split('T')[0],
      weight_kg: 75.5,
      height_cm: 175.0,
      body_fat_pct: 15.0,
      water_liters: 2.0,
      notes: 'Test metric from script'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_metrics')
      .insert(testPayload)
      .select()
      .single();
      
    if (insertError) {
      console.error('INSERT Error:', insertError);
    } else {
      console.log('INSERT Success:', insertData);
    }
    
    // Test 3: Check if we can update user_metrics
    if (insertData) {
      console.log('\n3. Testing UPDATE user_metrics...');
      const { data: updateData, error: updateError } = await supabase
        .from('user_metrics')
        .update({ weight_kg: 76.0 })
        .eq('id', insertData.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('UPDATE Error:', updateError);
      } else {
        console.log('UPDATE Success:', updateData);
      }
      
      // Clean up test data
      console.log('\n4. Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('user_metrics')
        .delete()
        .eq('id', insertData.id);
        
      if (deleteError) {
        console.error('DELETE Error:', deleteError);
      } else {
        console.log('DELETE Success: Test data cleaned up');
      }
    }
    
    console.log('\n✅ Database test completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();
