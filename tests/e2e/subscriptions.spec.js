const { test, expect } = require('@playwright/test');
const fs = require('fs');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const { assertSafety } = require('../../utils/safety');

dotenv.config({ path: process.env.ENV_FILE || '.env.testbots' });

const API_BASE = process.env.API_BASE_URL;
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
const BOTS_FILE = process.env.TEST_BOTS_FILE || './.testbots_credentials.json';
const WINDOW_START = process.env.TEST_WINDOW_START;
const WINDOW_END = process.env.TEST_WINDOW_END;

if (!API_BASE || !ADMIN_TOKEN) {
  throw new Error('Missing API_BASE_URL or ADMIN_API_TOKEN in .env.testbots');
}

const adminRequest = async (path, opts = {}) => {
  const res = await fetch(`${API_BASE.replace(/\/$/, '')}${path}`, {
    headers: { 'content-type': 'application/json', authorization: `Bearer ${ADMIN_TOKEN}` },
    ...opts
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
};

let testBots = [];
test.beforeAll(() => {
  if (!fs.existsSync(BOTS_FILE)) throw new Error(`${BOTS_FILE} not found -- run create-bots first`);
  const data = JSON.parse(fs.readFileSync(BOTS_FILE, 'utf8'));
  testBots = data.bots || [];
  if (testBots.length < 1) throw new Error('No test bots available');
});

test.describe('Subscriptions - admin to user flows', () => {
  test('Create subscription (admin) and validate on user profile and admin', async ({ page }, testInfo) => {
    const bot = testBots[0];
    // fetch user to validate safety
    const user = await adminRequest(`/admin/users/${bot.userId}`);
    try {
      assertSafety(user, WINDOW_START, WINDOW_END);
    } catch (e) {
      throw new Error(e.message);
    }

    // Create subscription via admin endpoint (replace /admin/subscriptions)
    const subBody = {
      user_id: bot.userId,
      plan: 'basic-monthly',
      start_date: new Date().toISOString(),
      metadata: { test_run: process.env.TEST_RUN_ID || 'manual' }
    };

    const created = await adminRequest('/admin/subscriptions', { method: 'POST', body: JSON.stringify(subBody) });
    testInfo.attachments = testInfo.attachments || [];
    try {
      expect(created).toBeTruthy();
      expect(created.user_id).toBe(bot.userId);
      expect(created.status).toBe('active');
      expect(new Date(created.start_date).getTime()).toBeGreaterThan(0);
      // basic checks for dates/duration
      expect(new Date(created.end_date).getTime()).toBeGreaterThan(new Date(created.start_date).getTime());
    } catch (err) {
      await page.screenshot({ path: `./artifacts/sub_create_fail_${bot.index}.png` });
      throw err;
    }

    // Verify visible in admin list
    const adminList = await adminRequest(`/admin/users/${bot.userId}/subscriptions`);
    expect(Array.isArray(adminList)).toBeTruthy();
    const found = adminList.find(s => s.id === created.id || s.plan === created.plan);
    expect(found).toBeTruthy();

    // Verify user profile view via public API
    const profile = await adminRequest(`/users/${bot.userId}/profile`);
    assertSafety(profile.user || profile, WINDOW_START, WINDOW_END);
    const subs = (profile.subscriptions || profile.user && profile.user.subscriptions) || [];
    const pf = subs.find(s => s.plan === created.plan);
    expect(pf).toBeTruthy();
  });
});
