const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTYzNTYyNywiZXhwIjoyMDQxMjExNjI3fQ.oaUJbOaKqjqaWYBQvYg3lHiKZKdXhgkTzEV2j5LmEOg';

// Load credentials
const credsPath = path.join(process.cwd(), '.testbots_credentials.json');
const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
const testBots = credsData.bots || [];

const logsDir = path.join(process.cwd(), 'artifacts', 'subscription-creation');

// Packages and durations
const packages = ['PILATES', 'ULTIMATE', 'ULTIMATE_MEDIUM', 'FREEGYM'];
const durations = [7, 14, 30, 60, 90];

function getStartDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split('T')[0];
}

function getEndDate(durationDays) {
  const date = new Date();
  date.setDate(date.getDate() + durationDays);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split('T')[0];
}

async function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

async function createMemberships() {
  console.log('\n' + '═'.repeat(80));
  console.log('🚀 CREATING REAL MEMBERSHIPS FOR 30 BOTS');
  console.log('═'.repeat(80));

  console.log(`\n✅ Loaded 30 test bots`);
  console.log(`📊 Packages: ${packages.length}`);
  console.log(`⏱️  Durations: ${durations.length}`);
  console.log(`📊 Total memberships to create: ${testBots.length * packages.length * durations.length}`);

  await ensureLogsDir();

  let createdCount = 0;
  let failedCount = 0;
  const createdSubs = [];
  const failedSubs = [];

  for (let botIdx = 0; botIdx < testBots.length; botIdx++) {
    const bot = testBots[botIdx];
    const botNum = String(botIdx).padStart(2, '0');
    const botLabel = bot.email || `BOT-${botNum}`;

    console.log(`\n👤 ${botLabel}`);

    for (const pkg of packages) {
      for (const duration of durations) {
        try {
          const startDate = getStartDate();
          const endDate = getEndDate(duration);

          // Create membership via Supabase REST API
          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/memberships`,
            {
              method: 'POST',
              headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify({
                user_id: bot.userId,
                package_id: pkg.toLowerCase(),
                start_date: startDate,
                end_date: endDate,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            createdCount++;
            createdSubs.push({
              botId: bot.userId,
              botEmail: bot.email,
              package: pkg,
              duration,
              startDate,
              endDate
            });
            process.stdout.write('  ✅');
          } else {
            failedCount++;
            failedSubs.push({
              botId: bot.userId,
              package: pkg,
              duration,
              status: response.status,
              statusText: response.statusText
            });
            process.stdout.write(`  ❌(${response.status})`);
          }
        } catch (error) {
          failedCount++;
          failedSubs.push({
            botId: bot.userId,
            package: pkg,
            duration,
            error: error.message
          });
          process.stdout.write(`  ⚠️`);
        }

        // Rate limiting - add small delay every 5 requests
        if ((createdCount + failedCount) % 5 === 0) {
          await new Promise(r => setTimeout(r, 100));
        }
      }
    }
  }

  // Save results
  const reportFile = path.join(logsDir, 'creation-results.json');
  fs.writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalBots: testBots.length,
    totalPackages: packages.length,
    totalDurations: durations.length,
    totalPlanned: testBots.length * packages.length * durations.length,
    created: createdCount,
    failed: failedCount,
    createdSubscriptions: createdSubs,
    failedSubscriptions: failedSubs.slice(0, 50) // Log first 50 failures
  }, null, 2));

  // Print summary
  console.log('\n\n' + '═'.repeat(80));
  console.log('🎉 MEMBERSHIP CREATION COMPLETE');
  console.log('═'.repeat(80));
  console.log(`\n✅ Created: ${createdCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📊 Success Rate: ${((createdCount / (createdCount + failedCount)) * 100).toFixed(1)}%`);
  console.log(`\n🎯 TARGETS:`);
  console.log(`  👥 Bots: ${testBots.length}`);
  console.log(`  📦 Packages: ${packages.length}`);
  console.log(`  ⏱️  Durations: ${durations.length}`);
  console.log(`  📊 Total planned: ${testBots.length * packages.length * durations.length}`);
  console.log(`\n📁 Results saved to: ${reportFile}`);
  console.log('═'.repeat(80) + '\n');

  return {
    created: createdCount,
    failed: failedCount,
    total: createdCount + failedCount
  };
}

// Run creation
createMemberships().catch(console.error);
