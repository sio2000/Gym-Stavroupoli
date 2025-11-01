#!/usr/bin/env node

/**
 * Script για να εφαρμόσει τα RPC functions για Pilates lessons στη βάση δεδομένων
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
  console.log('🚀 Εφαρμογή των RPC functions για Pilates lessons...\n');

  try {
    // Read SQL files
    const getUserLessonsPath = path.join(__dirname, 'database', 'functions', 'get_user_pilates_lessons.sql');
    const setUserLessonsPath = path.join(__dirname, 'database', 'functions', 'set_user_pilates_lessons.sql');
    
    const getUserLessonsContent = fs.readFileSync(getUserLessonsPath, 'utf8');
    const setUserLessonsContent = fs.readFileSync(setUserLessonsPath, 'utf8');

    console.log('📝 Διαβάστηκαν τα SQL files...\n');

    // Show SQL for manual execution
    console.log('📋 Παρακαλώ εκτελέστε τα παρακάτω SQL στο SQL Editor του Supabase:\n');
    console.log('═'.repeat(80));
    console.log('1️⃣  FUNCTION: get_user_pilates_lessons(text)');
    console.log('═'.repeat(80));
    console.log(getUserLessonsContent);
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('2️⃣  FUNCTION: set_user_pilates_lessons(text, integer)');
    console.log('═'.repeat(80));
    console.log(setUserLessonsContent);
    console.log('═'.repeat(80));
    
    console.log('\n✨ Μετά την εκτέλεση, μπορείτε να καλέσετε τα functions με:');
    console.log('   const { data } = await supabase.rpc("get_user_pilates_lessons", { p_user_email: "email@example.com" });');
    console.log('   const { data } = await supabase.rpc("set_user_pilates_lessons", { p_user_email: "email@example.com", p_lesson_count: 12 });');
    
  } catch (error) {
    console.error('❌ Σφάλμα:', error);
  }
}

// Run the script
applyFunctions();

