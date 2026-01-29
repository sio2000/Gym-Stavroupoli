const { test } = require('@playwright/test');
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

test.describe('Create Real Subscriptions for 30 Bots', () => {
  
  test('Create subscriptions for all bots with all packages and durations', async ({ page, context }) => {
    
    console.log(`\n🚀 Creating real subscriptions for ${testBots.length} bots...`);
    console.log(`📦 Packages: ${packages.length}`);
    console.log(`⏱️  Durations: ${durations.length}`);
    console.log(`📊 Total subscriptions: ${testBots.length * packages.length * durations.length}\n`);

    let created = 0;

    // Create subscriptions for each bot
    for (let botIdx = 0; botIdx < testBots.length; botIdx++) {
      const bot = testBots[botIdx];
      
      // Create a new page for each bot to avoid session conflicts
      const botPage = await context.newPage();
      
      try {
        console.log(`\n👤 BOT-${String(botIdx).padStart(2, '0')}: ${bot.fullname}`);
        
        // Navigate to admin
        await botPage.goto(`${BASE_URL}/admin/subscriptions`, { waitUntil: 'networkidle' }).catch(() => {});
        
        // Try to create subscriptions via API
        for (let pkgIdx = 0; pkgIdx < packages.length; pkgIdx++) {
          const pkg = packages[pkgIdx];
          
          for (let durIdx = 0; durIdx < durations.length; durIdx++) {
            const duration = durations[durIdx];
            
            const today = new Date();
            const startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);
            
            const subscriptionData = {
              userId: bot.userId,
              packageId: pkg.id,
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              status: 'active'
            };
            
            // Try to create via fetch API
            try {
              const response = await botPage.request.post(`${BASE_URL}/api/subscriptions/create`, {
                data: subscriptionData
              }).catch(() => null);
              
              if (response && response.ok()) {
                console.log(`  ✅ ${pkg.name} | ${duration}d`);
                created++;
              }
            } catch (e) {
              // Silent fail
            }
            
            // Add small delay
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
      } catch (e) {
        console.log(`  ⚠️  Error processing bot: ${e.message}`);
      } finally {
        await botPage.close();
      }
    }

    console.log(`\n
════════════════════════════════════════════════════════════════
✅ SUBSCRIPTIONS CREATION COMPLETE
════════════════════════════════════════════════════════════════
Total Subscriptions Created: ${created}
Target: ${testBots.length * packages.length * durations.length}

📝 Now refresh the browser to see the subscriptions!
════════════════════════════════════════════════════════════════
`);
  });
});
