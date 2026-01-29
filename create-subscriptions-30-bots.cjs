#!/usr/bin/env node

/**
 * Create real subscriptions for 30 bots
 * This script creates actual subscriptions in the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load test bot credentials
const credsPath = path.join(process.cwd(), '.testbots_credentials.json');
const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
const testBots = credsData.bots || [];

const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const logsDir = path.join(process.cwd(), 'artifacts', 'bot-subscriptions');

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

async function createSubscriptions() {
  console.log('\n' + '═'.repeat(80));
  console.log('🎯 CREATING REAL SUBSCRIPTIONS FOR 30 BOTS');
  console.log('═'.repeat(80));

  ensureLogsDir();

  // Actual package UUIDs from database
  const packages = [
    { uuid: 'c16de111-3687-41ce-a446-5af61a3c6eff', name: 'PILATES' },
    { uuid: 'feefb0d8-edc5-4eb1-befa-0b69a43ca75d', name: 'ULTIMATE' },
    { uuid: '728cc455-f122-4aca-8319-5cb0f44ec590', name: 'ULTIMATE_MEDIUM' },
    { uuid: '95bdb862-6cb4-4f57-a20e-3c6422f055dd', name: 'FREEGYM' }
  ];
  
  const results = {
    created: 0,
    failed: 0,
    subscriptions: [],
    timestamp: new Date().toISOString(),
    startTime: Date.now()
  };

  console.log(`\nTotal bots: ${testBots.length}`);
  console.log(`Packages: ${packages.map(p => p.name).join(', ')}`);
  console.log(`Duration: 30 days\n`);

  for (let i = 0; i < testBots.length; i++) {
    const bot = testBots[i];
    const selectedPackage = packages[i % packages.length];
    const progress = `[${i + 1}/${testBots.length}]`;

    try {
      // Calculate dates
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const startDateStr = startDate.toISOString().split('T')[0];

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);
      const endDateStr = endDate.toISOString().split('T')[0];

      // Insert into memberships table
      const { data, error } = await supabase
        .from('memberships')
        .insert([
          {
            user_id: bot.userId,
            package_id: selectedPackage.uuid,
            start_date: startDateStr,
            end_date: endDateStr,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          }
        ])
        .select();

      if (error) {
        console.log(`${progress} ❌ ${bot.email} (${selectedPackage.name}): ${error.message}`);
        results.failed++;
      } else if (data && data.length > 0) {
        const sub = data[0];
        results.created++;
        results.subscriptions.push({
          botEmail: bot.email,
          userId: bot.userId,
          package: selectedPackage.name,
          packageUUID: selectedPackage.uuid,
          id: sub.id,
          status: 'created'
        });
        console.log(`${progress} ✅ ${bot.email} (${selectedPackage.name})`);
      } else {
        console.log(`${progress} ⚠️  ${bot.email} (${selectedPackage.name}): No data returned`);
        results.failed++;
      }
    } catch (error) {
      console.log(`${progress} ❌ ${bot.email}: Exception - ${error.message}`);
      results.failed++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  results.endTime = Date.now();
  results.duration = `${((results.endTime - results.startTime) / 1000).toFixed(2)}s`;

  console.log(`\n${'═'.repeat(80)}`);
  console.log('📊 RESULTS');
  console.log('═'.repeat(80));
  console.log(`✅ Created: ${results.created}/${testBots.length}`);
  console.log(`❌ Failed: ${results.failed}/${testBots.length}`);
  console.log(`⏱️  Duration: ${results.duration}`);

  // Save results
  const resultsFile = path.join(logsDir, 'subscriptions-created.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  // Summary
  console.log(`\n${'═'.repeat(80)}`);
  console.log('🎉 SUBSCRIPTION CREATION COMPLETE');
  console.log('═'.repeat(80));
  console.log(`Total bots processed: ${testBots.length}`);
  console.log(`Subscriptions created: ${results.created}`);
  console.log(`Packages distributed: ${packages.map(p => p.name).join(', ')}`);
  console.log(`Duration per subscription: 30 days`);

  return results.created > 0;
}

// Run
createSubscriptions()
  .then(success => {
    if (success) {
      console.log('\n✅ All operations completed successfully');
      process.exit(0);
    } else {
      console.log('\n⚠️  No subscriptions were created');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });
