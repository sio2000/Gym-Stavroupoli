// Script για δοκιμή QR code scanning
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQRScanning() {
  try {
    console.log('🔧 Δοκιμάζω QR code scanning...\n');
    
    // 1. Ελέγχω πόσα QR codes υπάρχουν
    const { data: allQRCodes, error: allError } = await supabase
      .from('qr_codes')
      .select('*')
      .limit(5);

    if (allError) {
      console.error('❌ Error fetching QR codes:', allError);
      return;
    }

    console.log(`✅ Βρέθηκαν ${allQRCodes.length} QR codes συνολικά:\n`);
    
    allQRCodes.forEach((qr, index) => {
      console.log(`${index + 1}. ID: ${qr.id}`);
      console.log(`   User ID: ${qr.user_id}`);
      console.log(`   Category: ${qr.category}`);
      console.log(`   Status: ${qr.status}`);
      console.log(`   QR Token: ${qr.qr_token}`);
      console.log(`   Issued At: ${qr.issued_at}\n`);
    });

    // 2. Δοκιμάζω το νέο query που χρησιμοποιεί η εφαρμογή
    console.log('🔍 Δοκιμάζω το νέο query που χρησιμοποιεί η εφαρμογή...\n');
    
    const { data: testQR, error: testError } = await supabase
      .from('qr_codes')
      .select('qr_token, user_id, category')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (testError) {
      console.error('❌ Test query error:', testError);
      console.log('🔍 Error details:', JSON.stringify(testError, null, 2));
    } else if (testQR) {
      console.log('✅ Test query successful!');
      console.log('📊 QR Code data:', testQR);
      
      // Manual join για user profile
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name')
        .eq('user_id', testQR.user_id)
        .maybeSingle();
        
      if (userError) {
        console.error('❌ User profile query error:', userError);
      } else if (userProfile) {
        console.log('✅ User profile query successful!');
        console.log('👤 User profile data:', userProfile);
      } else {
        console.log('❌ User profile not found');
      }
    } else {
      console.log('❌ No active QR codes found');
    }

    // 3. Δοκιμάζω να βρω QR code με συγκεκριμένο token
    if (allQRCodes.length > 0) {
      const firstQR = allQRCodes[0];
      console.log(`\n🔍 Δοκιμάζω να βρω QR code με token: ${firstQR.qr_token.substring(0, 20)}...\n`);
      
      const { data: specificQR, error: specificError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('qr_token', firstQR.qr_token)
        .eq('status', 'active')
        .maybeSingle();

      if (specificError) {
        console.error('❌ Specific query error:', specificError);
      } else if (specificQR) {
        console.log('✅ Specific query successful!');
        console.log('📊 QR Code data:', specificQR);
        
        // Manual join για user profile
        const { data: specificUserProfile, error: specificUserError } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name')
          .eq('user_id', specificQR.user_id)
          .maybeSingle();
          
        if (specificUserError) {
          console.error('❌ Specific user profile query error:', specificUserError);
        } else if (specificUserProfile) {
          console.log('✅ Specific user profile query successful!');
          console.log('👤 Specific user profile data:', specificUserProfile);
        } else {
          console.log('❌ Specific user profile not found');
        }
      } else {
        console.log('❌ Specific QR code not found');
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testQRScanning();
