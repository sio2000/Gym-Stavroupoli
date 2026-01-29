#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load test bot credentials
const credsPath = path.join(process.cwd(), '.testbots_credentials.json');
const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
const testBots = credsData.bots || [];

const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Bots that failed (19, 20, 21, 22, 23)
const failedBotIndices = [18, 19, 20, 21, 22]; // 0-indexed

async function createUserProfiles() {
  console.log('\n' + '═'.repeat(80));
  console.log('👤 CREATING USER PROFILES FOR FAILED BOTS');
  console.log('═'.repeat(80));

  const results = {
    created: 0,
    failed: 0,
    timestamp: new Date().toISOString()
  };

  for (const idx of failedBotIndices) {
    const bot = testBots[idx];
    console.log(`\n[${idx + 1}/30] Creating profile for ${bot.email}...`);

    try {
      // Create user_profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: bot.userId,
            first_name: `Bot`,
            last_name: `${idx + 1}`,
            email: bot.email,
            phone: '6900000000',
            role: 'user',
            language: 'el',
            notification_preferences: {
              sms: false,
              push: true,
              email: true
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.failed++;
      } else if (data && data.length > 0) {
        console.log(`  ✅ Profile created`);
        results.created++;
      } else {
        console.log(`  ⚠️  No data returned`);
        results.failed++;
      }
    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`);
      results.failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n${'═'.repeat(80)}`);
  console.log(`✅ Profiles created: ${results.created}/${failedBotIndices.length}`);
  console.log(`❌ Failed: ${results.failed}/${failedBotIndices.length}`);

  return results.created === failedBotIndices.length;
}

// Run
createUserProfiles()
  .then(success => {
    if (success) {
      console.log('\n✅ All user profiles created successfully');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some profiles were not created');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });
