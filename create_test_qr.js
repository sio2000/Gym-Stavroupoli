// Script για δημιουργία test QR code
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestQR() {
  try {
    console.log('🔧 Δημιουργώ test QR code...\n');
    
    // Χρησιμοποιώ έναν από τους υπάρχοντες users
    const testUserId = '2bf5fc31-2b64-4778-aecf-06d90abfd80d'; // DON Firen
    const testCategory = 'free_gym';
    
    // Δημιουργώ ultra simple QR token
    const testToken = `${testUserId}-${testCategory}`;
    
    console.log('📊 Test QR Token:', testToken);
    console.log('👤 Test User ID:', testUserId);
    console.log('🏷️ Test Category:', testCategory);
    
    // Δημιουργώ το QR code
    const { data: qrCode, error } = await supabase
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
      console.error('❌ Error creating test QR code:', error);
      return;
    }

    console.log('✅ Test QR code created successfully!');
    console.log('📊 QR Code data:', qrCode);
    
    // Ελέγχω αν μπορώ να το βρω
    const { data: foundQR, error: findError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_token', testToken)
      .eq('status', 'active')
      .maybeSingle();
      
    if (findError) {
      console.error('❌ Error finding test QR code:', findError);
    } else if (foundQR) {
      console.log('✅ Test QR code found successfully!');
      console.log('📊 Found QR Code data:', foundQR);
      
      // Ελέγχω user profile
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name')
        .eq('user_id', foundQR.user_id)
        .maybeSingle();
        
      if (userError) {
        console.error('❌ Error finding user profile:', userError);
      } else if (userProfile) {
        console.log('✅ User profile found successfully!');
        console.log('👤 User profile data:', userProfile);
        console.log(`\n🎯 READY FOR TESTING!`);
        console.log(`📱 QR Token to scan: ${testToken}`);
        console.log(`👤 Expected user: ${userProfile.first_name} ${userProfile.last_name}`);
        console.log(`📧 Expected email: ${userProfile.email}`);
      } else {
        console.log('❌ User profile not found');
      }
    } else {
      console.log('❌ Test QR code not found');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

createTestQR();
