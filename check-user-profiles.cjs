#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkUserProfiles() {
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error:', error.message);
  } else if (profiles && profiles.length > 0) {
    console.log('Sample user_profile:');
    console.log(JSON.stringify(profiles[0], null, 2));
  } else {
    console.log('No profiles found');
  }
}

checkUserProfiles();
