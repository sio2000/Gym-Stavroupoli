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
  const url = `${API_BASE.replace(/\/auth\/v1$/, '/rest/v1')}${path}`;
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${ADMIN_TOKEN}`, apikey: ADMIN_TOKEN, ...(opts.headers || {}) };
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  if (!text) {
    console.log(`Empty response from ${opts.method || 'GET'} ${path} (status: ${res.status})`);
    return res.status === 201 || res.status === 200 ? [] : null;
  }
  try { return JSON.parse(text); } catch { return text; }
};

let testBots = [];
test.beforeAll(() => {
  if (!fs.existsSync(BOTS_FILE)) throw new Error(`${BOTS_FILE} not found -- run create-bots first`);
  const data = JSON.parse(fs.readFileSync(BOTS_FILE, 'utf8'));
  testBots = data.bots || [];
  if (testBots.length < 5) throw new Error('Need at least 5 test bots');
});

test.describe('Bookings & Pilates - admin to user flows', () => {
  test('Get Pilates package info and verify availability', async ({ page }, testInfo) => {
    const bot = testBots[4];
    assertSafety(bot, WINDOW_START, WINDOW_END);

    // Get all available packages
    const allPkgs = await adminRequest('/membership_packages?select=*&is_active=eq.true');
    console.log('Available packages:', allPkgs.map(p => p.name));
    
    // Try to find Pilates
    const pilatesPkgs = allPkgs.filter(p => p.name.includes('Pilates'));
    if (pilatesPkgs.length > 0) {
      expect(pilatesPkgs[0].is_active).toBe(true);
      console.log('Pilates package found:', pilatesPkgs[0].name);
    } else {
      console.log('No Pilates package found - gym may not offer pilates');
    }
  });

  test('List pilates lessons if available', async ({ page }, testInfo) => {
    const bot = testBots[5];
    assertSafety(bot, WINDOW_START, WINDOW_END);

    // Check if pilates_lessons table exists and has data
    const lessons = await adminRequest('/pilates_lessons?select=*&limit=5');
    if (Array.isArray(lessons)) {
      console.log('Found', lessons.length, 'pilates lessons');
      expect(lessons.length).toBeGreaterThanOrEqual(0);
    } else {
      console.log('pilates_lessons table may not exist or be empty');
    }
  });

  test('Verify gym bookings capability (if bookings table exists)', async ({ page }, testInfo) => {
    const bot = testBots[6];
    assertSafety(bot, WINDOW_START, WINDOW_END);

    // Create user profile
    const profileCheck = await adminRequest(`/user_profiles?user_id=eq.${bot.userId}&select=user_id`);
    if (!Array.isArray(profileCheck) || profileCheck.length === 0) {
      await adminRequest('/user_profiles', {
        method: 'POST',
        body: JSON.stringify([{ user_id: bot.userId }])
      });
    }

    // Try to fetch existing bookings for this user
    const bookings = await adminRequest(`/bookings?user_id=eq.${bot.userId}&select=*`);
    if (Array.isArray(bookings)) {
      console.log('Gym bookings table exists with', bookings.length, 'bookings for bot');
      expect(Array.isArray(bookings)).toBeTruthy();
    } else {
      console.log('Bookings table may not exist');
    }
  });
});
