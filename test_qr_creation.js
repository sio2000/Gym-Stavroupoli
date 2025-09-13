// Script για δοκιμή δημιουργίας QR code
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQRCreation() {
  try {
    console.log('🔧 Δοκιμάζω να δημιουργήσω ένα test QR code...\n');
    
    // Δημιουργώ ένα test QR code
    const testUserId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID
    const testCategory = 'free_gym';
    const testToken = `${testUserId}-${testCategory}`;
    
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        user_id: testUserId,
        category: testCategory,
        status: 'active',
        qr_token: testToken,
        expires_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating QR code:', error);
      console.log('🔍 Error details:', JSON.stringify(error, null, 2));
      
      if (error.code === 'PGRST204') {
        console.log('❌ Το qr_codes table ΔΕΝ υπάρχει!');
        console.log('🔧 Χρειάζεται να δημιουργηθεί το table από το Supabase Dashboard');
      }
    } else {
      console.log('✅ QR code δημιουργήθηκε επιτυχώς!');
      console.log('📊 QR Code data:', data);
      
      // Διαγράφω το test QR code
      await supabase
        .from('qr_codes')
        .delete()
        .eq('id', data.id);
      
      console.log('🗑️ Test QR code διαγράφηκε');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testQRCreation();
