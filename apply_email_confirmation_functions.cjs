#!/usr/bin/env node

/**
 * Script για να εφαρμόσει τα RPC functions για email confirmation στη βάση δεδομένων
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFunctions() {
  console.log('🚀 Εφαρμογή των RPC functions για email confirmation...\n');

  try {
    // Read SQL files
    const getUnconfirmedPath = path.join(__dirname, 'database', 'functions', 'get_unconfirmed_emails.sql');
    const confirmAllPath = path.join(__dirname, 'database', 'functions', 'confirm_all_emails.sql');
    
    const getUnconfirmedContent = fs.readFileSync(getUnconfirmedPath, 'utf8');
    const confirmAllContent = fs.readFileSync(confirmAllPath, 'utf8');

    console.log('📝 Διαβάστηκαν τα SQL files...\n');

    // Show SQL for manual execution
    console.log('📋 Παρακαλώ εκτελέστε τα παρακάτω SQL στο SQL Editor του Supabase:\n');
    console.log('═'.repeat(80));
    console.log('1️⃣  FUNCTION: get_unconfirmed_emails()');
    console.log('═'.repeat(80));
    console.log(getUnconfirmedContent);
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('2️⃣  FUNCTION: confirm_all_emails()');
    console.log('═'.repeat(80));
    console.log(confirmAllContent);
    console.log('═'.repeat(80));
    
    console.log('\n✨ Μετά την εκτέλεση, μπορείτε να καλέσετε τα functions με:');
    console.log('   const { data, error } = await supabase.rpc("get_unconfirmed_emails");');
    console.log('   const { data, error } = await supabase.rpc("confirm_all_emails");');
    
  } catch (error) {
    console.error('❌ Σφάλμα:', error);
  }
}

// Run the script
applyFunctions();

