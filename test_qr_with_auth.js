// Script για δοκιμή δημιουργίας QR code με authentication
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQRCreationWithAuth() {
  try {
    console.log('🔧 Δοκιμάζω να δημιουργήσω QR code με authentication...\n');
    
    // Πρώτα κάνω login ως user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'tolatek504@cspaus.com',
      password: 'password123'
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }

    console.log('✅ Login successful!');
    console.log('👤 User ID:', authData.user.id);
    
    // Τώρα δοκιμάζω να δημιουργήσω QR code
    const testCategory = 'free_gym';
    const testToken = `${authData.user.id}-${testCategory}`;
    
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        user_id: authData.user.id,
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

    // Logout
    await supabase.auth.signOut();
    console.log('👋 Logged out');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testQRCreationWithAuth();
