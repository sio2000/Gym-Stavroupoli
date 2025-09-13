import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createRealUserQR() {
  console.log('🔧 Δημιουργώ QR code για πραγματικό user...');
  
  // Use a real user ID from the database
  const userId = '5d1d6cdc-6ed9-4630-ad7a-5ce7e9378e63'; // KYRIAKOS VAFEAS
  const category = 'free_gym';
  const qrToken = `${userId}-${category}`;
  
  console.log('👤 User ID:', userId);
  console.log('🏷️ Category:', category);
  console.log('📊 Generated QR Token:', qrToken);
  
  try {
    // Delete existing QR code if exists
    const { error: deleteError } = await supabase
      .from('qr_codes')
      .delete()
      .eq('qr_token', qrToken);
    
    if (deleteError) {
      console.log('⚠️ Delete error (might not exist):', deleteError);
    } else {
      console.log('✅ Deleted existing QR code');
    }
    
    // Create new QR code
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        user_id: userId,
        category: category,
        qr_token: qrToken,
        status: 'active',
        issued_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.log('❌ Error creating QR code:', error);
    } else {
      console.log('✅ QR code created successfully:', data);
    }
    
  } catch (err) {
    console.log('❌ Exception:', err);
  }
}

createRealUserQR();

