// Test field preservation logic
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFieldPreservation() {
  console.log('Testing field preservation logic...');
  
  const userId = 'dcfce45b-8418-4cb3-b81d-762a7575d8d4';
  const testDate = new Date().toISOString().split('T')[0];
  
  try {
    // Clean up any existing test data
    console.log('\n1. Cleaning up test data...');
    await supabase
      .from('user_metrics')
      .delete()
      .eq('user_id', userId)
      .eq('metric_date', testDate);
    
    // Test 1: Add weight only
    console.log('\n2. Adding weight only...');
    const { data: weightData, error: weightError } = await supabase
      .from('user_metrics')
      .insert({
        user_id: userId,
        metric_date: testDate,
        weight_kg: 75.5,
        height_cm: null,
        body_fat_pct: null,
        water_liters: null
      })
      .select()
      .single();
      
    if (weightError) {
      console.error('Weight insert error:', weightError);
      return;
    }
    
    console.log('Weight added:', weightData);
    
    // Test 2: Add height to existing record
    console.log('\n3. Adding height to existing record...');
    const { data: heightData, error: heightError } = await supabase
      .from('user_metrics')
      .update({
        height_cm: 175.0
      })
      .eq('id', weightData.id)
      .select()
      .single();
      
    if (heightError) {
      console.error('Height update error:', heightError);
      return;
    }
    
    console.log('Height added:', heightData);
    console.log('Weight preserved:', heightData.weight_kg);
    
    // Test 3: Add body fat to existing record
    console.log('\n4. Adding body fat to existing record...');
    const { data: bodyFatData, error: bodyFatError } = await supabase
      .from('user_metrics')
      .update({
        body_fat_pct: 15.0
      })
      .eq('id', weightData.id)
      .select()
      .single();
      
    if (bodyFatError) {
      console.error('Body fat update error:', bodyFatError);
      return;
    }
    
    console.log('Body fat added:', bodyFatData);
    console.log('Weight preserved:', bodyFatData.weight_kg);
    console.log('Height preserved:', bodyFatData.height_cm);
    
    // Test 4: Update weight only
    console.log('\n5. Updating weight only...');
    const { data: weightUpdateData, error: weightUpdateError } = await supabase
      .from('user_metrics')
      .update({
        weight_kg: 76.0
      })
      .eq('id', weightData.id)
      .select()
      .single();
      
    if (weightUpdateError) {
      console.error('Weight update error:', weightUpdateError);
      return;
    }
    
    console.log('Weight updated:', weightUpdateData);
    console.log('Height preserved:', weightUpdateData.height_cm);
    console.log('Body fat preserved:', weightUpdateData.body_fat_pct);
    
    // Clean up
    console.log('\n6. Cleaning up test data...');
    await supabase
      .from('user_metrics')
      .delete()
      .eq('id', weightData.id);
    
    console.log('\n✅ Field preservation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFieldPreservation();
