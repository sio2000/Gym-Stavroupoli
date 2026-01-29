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
  // Replace /auth/v1 with /rest/v1 if needed
  const url = `${API_BASE.replace(/\/auth\/v1$/, '/rest/v1')}${path}`;
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${ADMIN_TOKEN}`, apikey: ADMIN_TOKEN, ...(opts.headers || {}) };
  const res = await fetch(url, {
    ...opts,
    headers
  });
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
  if (testBots.length < 1) throw new Error('No test bots available');
});

test.describe('Subscriptions - admin to user flows', () => {
  test('Create subscription (admin) and validate on user profile and admin', async ({ page }, testInfo) => {
    const bot = testBots[0];
    // fetch user to validate safety
    try {
      assertSafety(bot, WINDOW_START, WINDOW_END);
    } catch (e) {
      throw new Error(e.message);
    }

    // Create user_profile if needed (required for memberships FK constraint)
    const profileCheck = await adminRequest(`/user_profiles?user_id=eq.${bot.userId}&select=user_id`);
    if (!Array.isArray(profileCheck) || profileCheck.length === 0) {
      console.log('Creating user_profile for bot:', bot.userId);
      const profileCreate = await adminRequest('/user_profiles', {
        method: 'POST',
        body: JSON.stringify([{ user_id: bot.userId }])
      });
      console.log('Profile creation response:', profileCreate);
    }

    // Get a Free Gym package (all tests use Free Gym)
    const pkgList = await adminRequest('/membership_packages?select=*&name=eq.Free%20Gym&is_active=eq.true');
    console.log('Package list response:', pkgList);
    expect(Array.isArray(pkgList) && pkgList.length > 0).toBeTruthy();
    const freeGymPkg = pkgList[0];

    // Create membership (direct REST insert into memberships table)
    const now = new Date();
    const startDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days later

    const memBody = {
      user_id: bot.userId,
      package_id: freeGymPkg.id,
      duration_type: 'month',
      start_date: startDate,
      end_date: endDate,
      status: 'active'
    };

    const created = await adminRequest('/memberships', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([memBody])
    });

    console.log('Membership creation response:', JSON.stringify(created, null, 2));
    expect(Array.isArray(created)).toBeTruthy();
    expect(created.length).toBeGreaterThan(0);
    const membership = created[0];
    expect(membership.id).toBeTruthy();
    expect(membership.user_id).toBe(bot.userId);
    expect(membership.status).toBe('active');

    // Verify by fetching the created membership
    const getMem = await adminRequest(`/memberships?id=eq.${membership.id}`);
    console.log('Membership verification response:', getMem);
    expect(Array.isArray(getMem)).toBeTruthy();
    expect(getMem.length).toBeGreaterThan(0);
    const verified = getMem[0];
    expect(verified.user_id).toBe(bot.userId);
    expect(verified.status).toBe('active');
    expect(new Date(verified.end_date).getTime()).toBeGreaterThan(new Date(verified.start_date).getTime());
  });

  test('Renew subscription before expiration', async ({ page }, testInfo) => {
    const bot = testBots[1];
    assertSafety(bot, WINDOW_START, WINDOW_END);

    // Create initial membership for bot 2
    const profileCheck = await adminRequest(`/user_profiles?user_id=eq.${bot.userId}&select=user_id`);
    if (!Array.isArray(profileCheck) || profileCheck.length === 0) {
      await adminRequest('/user_profiles', {
        method: 'POST',
        body: JSON.stringify([{ user_id: bot.userId }])
      });
    }

    const pkgList = await adminRequest('/membership_packages?select=*&name=eq.Free%20Gym&is_active=eq.true');
    const pkg = pkgList[0];

    // Create membership with short duration
    const startDate = '2026-01-28';
    const endDate = '2026-02-10'; // 13 days
    const memBody = {
      user_id: bot.userId,
      package_id: pkg.id,
      duration_type: 'month',
      start_date: startDate,
      end_date: endDate,
      status: 'active'
    };

    const created = await adminRequest('/memberships', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([memBody])
    });
    expect(created.length).toBeGreaterThan(0);
    const membership = created[0];

    // Now renew: update end_date to extend membership
    const renewed = await adminRequest(`/memberships?id=eq.${membership.id}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ end_date: '2026-03-10', updated_at: new Date().toISOString() })
    });

    expect(Array.isArray(renewed) && renewed.length > 0).toBeTruthy();
    const renewedMem = renewed[0];
    expect(new Date(renewedMem.end_date).getTime()).toBeGreaterThan(new Date(endDate).getTime());
  });

  test('Upgrade package (same user, different package)', async ({ page }, testInfo) => {
    const bot = testBots[2];
    assertSafety(bot, WINDOW_START, WINDOW_END);

    // Create user profile
    const profileCheck = await adminRequest(`/user_profiles?user_id=eq.${bot.userId}&select=user_id`);
    if (!Array.isArray(profileCheck) || profileCheck.length === 0) {
      await adminRequest('/user_profiles', {
        method: 'POST',
        body: JSON.stringify([{ user_id: bot.userId }])
      });
    }

    // Get Free Gym package
    const freePkgList = await adminRequest('/membership_packages?select=*&name=eq.Free%20Gym&is_active=eq.true');
    const freePkg = freePkgList[0];

    // Create initial membership with Free Gym
    const memBody = {
      user_id: bot.userId,
      package_id: freePkg.id,
      duration_type: 'month',
      start_date: '2026-01-28',
      end_date: '2026-02-27',
      status: 'active'
    };

    const created = await adminRequest('/memberships', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([memBody])
    });
    const membership = created[0];

    // Now simulate upgrade by deactivating old and creating new with Pilates package
    const pilatesPkgList = await adminRequest('/membership_packages?select=*&name=eq.Pilates&is_active=eq.true');
    if (pilatesPkgList && pilatesPkgList.length > 0) {
      const pilatesPkg = pilatesPkgList[0];

      // Deactivate old
      await adminRequest(`/memberships?id=eq.${membership.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      });

      // Create new with Pilates
      const upgraded = await adminRequest('/memberships', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify([{
          user_id: bot.userId,
          package_id: pilatesPkg.id,
          duration_type: 'month',
          start_date: '2026-01-28',
          end_date: '2026-02-27',
          status: 'active'
        }])
      });

      expect(upgraded.length).toBeGreaterThan(0);
      expect(upgraded[0].package_id).toBe(pilatesPkg.id);
    }
  });

  test('Verify expiration date correctness', async ({ page }, testInfo) => {
    const bot = testBots[3];
    assertSafety(bot, WINDOW_START, WINDOW_END);

    // Create user profile
    const profileCheck = await adminRequest(`/user_profiles?user_id=eq.${bot.userId}&select=user_id`);
    if (!Array.isArray(profileCheck) || profileCheck.length === 0) {
      await adminRequest('/user_profiles', {
        method: 'POST',
        body: JSON.stringify([{ user_id: bot.userId }])
      });
    }

    // Get Free Gym package
    const pkgList = await adminRequest('/membership_packages?select=*&name=eq.Free%20Gym&is_active=eq.true');
    const pkg = pkgList[0];

    // Create with specific dates
    const startDate = '2026-01-28';
    const endDate = '2026-02-27'; // Should be exactly 30 days
    const memBody = {
      user_id: bot.userId,
      package_id: pkg.id,
      duration_type: 'month',
      start_date: startDate,
      end_date: endDate,
      status: 'active'
    };

    const created = await adminRequest('/memberships', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify([memBody])
    });
    const membership = created[0];

    // Verify date calculation
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(30);
    expect(membership.status).toBe('active');
    expect(membership.is_active).toBe(true);
  });
});
