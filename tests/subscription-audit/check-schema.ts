/**
 * CHECK MEMBERSHIPS TABLE SCHEMA
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function checkSchema() {
  // Get existing memberships to see their structure
  const { data: memberships, error } = await supabase
    .from('memberships')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample membership structure:');
    console.log(JSON.stringify(memberships[0], null, 2));
  }
}

checkSchema();
