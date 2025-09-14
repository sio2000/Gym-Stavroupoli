// Script για έλεγχο της database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('🔍 Ελέγχω την database για QR codes table...\n');
    
    // Ελέγχω αν υπάρχει το qr_codes table
    const { data: qrCodes, error } = await supabase
      .from('qr_codes')
      .select('*');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (qrCodes && qrCodes.length > 0) {
      console.log(`✅ Βρέθηκαν ${qrCodes.length} QR codes συνολικά:\n`);
      
      qrCodes.forEach((qr, index) => {
        console.log(`${index + 1}. ID: ${qr.id}`);
        console.log(`   User ID: ${qr.user_id}`);
        console.log(`   Category: ${qr.category}`);
        console.log(`   Status: ${qr.status}`);
        console.log(`   QR Token: ${qr.qr_token}`);
        console.log(`   QR Token Length: ${qr.qr_token?.length || 0}`);
        console.log(`   Format Analysis: ${analyzeQRFormat(qr.qr_token)}`);
        console.log(`   Issued At: ${qr.issued_at}`);
        console.log('');
      });
    } else {
      console.log('❌ Δεν υπάρχουν QR codes στη database!');
      console.log('🔍 Ελέγχω αν υπάρχει το qr_codes table...');
      
      // Ελέγχω αν υπάρχει το table
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'qr_codes');
        
      if (tableError) {
        console.log('❌ Δεν μπορώ να ελέγξω τα tables:', tableError);
      } else if (tables && tables.length > 0) {
        console.log('✅ Το qr_codes table υπάρχει αλλά είναι άδειο');
      } else {
        console.log('❌ Το qr_codes table ΔΕΝ υπάρχει!');
        console.log('🔧 Χρειάζεται να δημιουργηθεί το table!');
      }
    }

    // Ελέγχω user profiles για ένα QR code
    if (qrCodes.length > 0) {
      console.log('🔍 Ελέγχω user profile για το πρώτο QR code...\n');
      
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, role')
        .eq('id', qrCodes[0].user_id)
        .single();

      if (userError) {
        console.error('❌ User Profile Error:', userError);
      } else {
        console.log('✅ User Profile:');
        console.log(`   ID: ${userProfile.id}`);
        console.log(`   Email: ${userProfile.email}`);
        console.log(`   First Name: ${userProfile.first_name}`);
        console.log(`   Last Name: ${userProfile.last_name}`);
        console.log(`   Role: ${userProfile.role}`);
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

function analyzeQRFormat(token) {
  if (!token) return 'EMPTY';
  
  // Ultra simple format: userId-category
  if (token.includes('-') && token.split('-').length === 2) {
    const parts = token.split('-');
    const userId = parts[0];
    const category = parts[1];
    
    // Check if first part is UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(userId)) {
      return `ULTRA_SIMPLE (${category})`;
    }
  }
  
  // Old format: QR_USER_CATEGORY
  if (token.startsWith('QR_')) {
    return 'OLD_SIMPLE';
  }
  
  // HMAC format (long hex string)
  if (token.length > 50 && /^[a-f0-9]+$/i.test(token)) {
    return 'HMAC_SIGNED';
  }
  
  // Test format
  if (token === 'test-qr-code-123') {
    return 'TEST';
  }
  
  return 'UNKNOWN';
}

checkDatabase();
