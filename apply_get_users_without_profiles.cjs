#!/usr/bin/env node

/**
 * Script για να εφαρμόσει το RPC function get_users_without_profiles στη βάση δεδομένων
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

async function applyFunction() {
  console.log('🚀 Εφαρμογή του RPC function get_users_without_profiles...\n');

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'database', 'functions', 'get_users_without_profiles.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Διαβάστηκε το SQL file...');

    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });

    if (error) {
      console.error('❌ Σφάλμα κατά την εκτέλεση του SQL:', error);
      
      // Fallback: Try using the SQL Editor directly (manual step)
      console.log('\n📋 Παρακαλώ εκτελέστε το παρακάτω SQL στο SQL Editor του Supabase:\n');
      console.log('─'.repeat(80));
      console.log(sqlContent);
      console.log('─'.repeat(80));
      return;
    }

    console.log('✅ Το RPC function εφαρμόστηκε επιτυχώς!');
    console.log('\n✨ Τώρα μπορείτε να καλέσετε το function με:');
    console.log('   const { data, error } = await supabase.rpc("get_users_without_profiles");');
    
  } catch (error) {
    console.error('❌ Σφάλμα:', error);
    
    // Fallback: Show SQL for manual execution
    const sqlPath = path.join(__dirname, 'database', 'functions', 'get_users_without_profiles.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('\n📋 Παρακαλώ εκτελέστε το παρακάτω SQL στο SQL Editor του Supabase:\n');
    console.log('─'.repeat(80));
    console.log(sqlContent);
    console.log('─'.repeat(80));
  }
}

// Run the script
applyFunction();

