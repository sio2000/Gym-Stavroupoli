const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load credentials
const credsPath = path.join(process.cwd(), '.testbots_credentials.json');
const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
const testBots = credsData.bots || [];

const BASE_URL = 'http://localhost:3000';

const packages = [
  { name: 'PILATES', id: 'pilates' },
  { name: 'ULTIMATE', id: 'ultimate' },
  { name: 'ULTIMATE_MEDIUM', id: 'ultimate_medium' },
  { name: 'FREEGYM', id: 'freegym' }
];

const durations = [7, 14, 30, 60, 90];

async function createSubscription(userId, packageId, durationDays) {
  try {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const payload = {
      userId: userId,
      packageId: packageId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      durationDays: durationDays,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const response = await fetch(`${BASE_URL}/api/admin/subscriptions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin'
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (response && response.ok()) {
      const result = await response.json();
      console.log(`✅ Created: ${payload.userId} | ${packageId} | ${durationDays}d`);
      return true;
    } else {
      // Try alternative endpoint
      const response2 = await fetch(`${BASE_URL}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (response2 && response2.ok()) {
        console.log(`✅ Created (alt): ${payload.userId} | ${packageId} | ${durationDays}d`);
        return true;
      } else {
        console.log(`⚠️  Could not create: ${payload.userId} | ${packageId} | ${durationDays}d`);
        return false;
      }
    }
  } catch (e) {
    console.error(`❌ Error creating subscription: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log(`\n🚀 Creating subscriptions for ${testBots.length} bots...`);
  console.log(`📦 Packages: ${packages.length}`);
  console.log(`⏱️  Durations: ${durations.length}`);
  console.log(`📊 Total subscriptions to create: ${testBots.length * packages.length * durations.length}\n`);

  let created = 0;
  let failed = 0;

  // Create subscriptions for each bot
  for (let botIdx = 0; botIdx < testBots.length; botIdx++) {
    const bot = testBots[botIdx];
    console.log(`\n👤 BOT-${String(botIdx).padStart(2, '0')}: ${bot.fullname}`);

    // Each bot gets multiple subscriptions with different packages and durations
    for (let pkgIdx = 0; pkgIdx < packages.length; pkgIdx++) {
      const pkg = packages[pkgIdx];

      // Create subscriptions with different durations
      for (let durIdx = 0; durIdx < durations.length; durIdx++) {
        const duration = durations[durIdx];
        const success = await createSubscription(bot.userId, pkg.id, duration);
        
        if (success) {
          created++;
        } else {
          failed++;
        }

        // Add small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  console.log(`\n
╔════════════════════════════════════════════════════════════════╗
║ 🎉 SUBSCRIPTION CREATION REPORT                              ║
╚════════════════════════════════════════════════════════════════╝

✅ Total Subscriptions Created: ${created}
❌ Total Subscriptions Failed: ${failed}

🤖 Bots: ${testBots.length}
📦 Packages per Bot: ${packages.length}
⏱️  Durations per Package: ${durations.length}
📊 Total Expected: ${testBots.length * packages.length * durations.length}

════════════════════════════════════════════════════════════════
`);

  console.log('\n📝 Now refresh your browser to see the subscriptions in the Secretary Dashboard!\n');
}

main().catch(console.error);
