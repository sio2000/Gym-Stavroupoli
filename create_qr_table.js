// Script για δημιουργία του qr_codes table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createQRTable() {
  try {
    console.log('🔧 Δημιουργώ το qr_codes table...\n');
    
    // Δημιουργώ το qr_codes table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS qr_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          category VARCHAR(20) NOT NULL CHECK (category IN ('free_gym', 'pilates', 'personal')),
          status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
          qr_token VARCHAR(255) NOT NULL UNIQUE,
          issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NULL,
          last_scanned_at TIMESTAMPTZ NULL,
          scan_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes(user_id);
        CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(qr_token);
        CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON qr_codes(status);
        CREATE INDEX IF NOT EXISTS idx_qr_codes_expires_at ON qr_codes(expires_at);
      `
    });

    if (error) {
      console.error('❌ Error creating table:', error);
      return;
    }

    console.log('✅ Το qr_codes table δημιουργήθηκε επιτυχώς!');
    
    // Ελέγχω αν δημιουργήθηκε
    const { data: testData, error: testError } = await supabase
      .from('qr_codes')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing table:', testError);
    } else {
      console.log('✅ Το table λειτουργεί σωστά!');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

createQRTable();
