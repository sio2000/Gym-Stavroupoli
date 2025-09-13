// Script για testing πραγματικού QR code scanning
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealQRScanning() {
  try {
    console.log('🔍 Testing πραγματικού QR code scanning...\n');
    
    // Παίρνω ένα πραγματικό QR code από τη database
    const { data: qrCodes, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('status', 'active')
      .limit(1);
      
    if (qrError || !qrCodes || qrCodes.length === 0) {
      console.error('❌ Error fetching QR codes:', qrError);
      return;
    }
    
    const testQR = qrCodes[0];
    console.log('📊 Test QR Code:', testQR.qr_token);
    console.log('👤 User ID:', testQR.user_id);
    console.log('🏷️ Category:', testQR.category);
    
    // Δοκιμάζω το manual join όπως στο SecretaryDashboard
    console.log('\n🔍 Testing manual join...');
    
    // Step 1: Find QR code by qr_token
    const { data: qrCode, error: qrError2 } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_token', testQR.qr_token)
      .eq('status', 'active')
      .maybeSingle();

    console.log('🔍 QR Code query result:', qrCode ? 'Found' : 'Not found', qrError2 ? 'Error' : 'No error');
    console.log('🔍 QR Code data:', qrCode);
    console.log('🔍 QR Error:', qrError2);

    if (qrError2 || !qrCode) {
      console.log('❌ QR code validation failed');
      return;
    }

    // Step 2: Get user profile data manually
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name')
      .eq('user_id', qrCode.user_id)
      .maybeSingle();

    console.log('🔍 User profile query result:', userProfile ? 'Found' : 'Not found', userError ? 'Error' : 'No error');
    console.log('🔍 User profile data:', userProfile);
    console.log('🔍 User profile error:', userError);

    if (userError || !userProfile) {
      console.log('❌ User profile validation failed');
      return;
    }

    // Step 3: Simulate successful scan
    console.log('\n✅ QR Code validated successfully!');
    console.log('👤 User:', userProfile.first_name, userProfile.last_name);
    console.log('📧 Email:', userProfile.email);
    console.log('🏷️ Category:', qrCode.category);
    
    console.log('\n🎯 READY FOR TESTING!');
    console.log(`📱 QR Token to scan: ${testQR.qr_token}`);
    console.log(`👤 Expected user: ${userProfile.first_name} ${userProfile.last_name}`);
    console.log(`📧 Expected email: ${userProfile.email}`);
    console.log(`🏷️ Expected category: ${testQR.category}`);
    
    console.log('\n📋 INSTRUCTIONS:');
    console.log('1. Δημιούργησε ένα QR code με αυτό το token:', testQR.qr_token);
    console.log('2. Σκάναρέ το από την γραμματεία');
    console.log(`3. Θα εμφανιστεί: ${userProfile.first_name} ${userProfile.last_name} - ${userProfile.email}`);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testRealQRScanning();
