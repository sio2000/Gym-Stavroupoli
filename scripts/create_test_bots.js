const fs = require('fs');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config({ path: process.env.ENV_FILE || '.env.testbots' });

const API_BASE = process.env.API_BASE_URL;
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
const CONFIRM = process.env.CONFIRM_RUN;
const OUT_FILE = process.env.TEST_BOTS_FILE || './.testbots_credentials.json';

if (!API_BASE || !ADMIN_TOKEN) {
  console.error('Missing API_BASE_URL or ADMIN_API_TOKEN in .env.testbots');
  process.exit(1);
}

if (CONFIRM !== 'YES_I_CONFIRM') {
  console.error('Refusing to run. Set CONFIRM_RUN=YES_I_CONFIRM in .env.testbots to proceed.');
  process.exit(1);
}

const now = Date.now();
const bots = [];

async function createBot(i) {
  const email = `qa.bot+${now}.${String(i).padStart(2,'0')}@example.com`;
  const fullname = `QA BOT ${String(i).padStart(2,'0')} - TEST ONLY`;
  const password = `P@ssword-qa-${now}-${i}`;

  const body = {
    email,
    fullname,
    password,
    is_test_user: true
  };

  // NOTE: Replace /admin/users with your real admin user creation endpoint
  const res = await fetch(`${API_BASE.replace(/\/$/, '')}/admin/users`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed creating bot ${i}: ${res.status} ${t}`);
  }

  const user = await res.json();

  const cred = { index: i, email, fullname, password, userId: user.id, created_at: user.created_at || new Date().toISOString() };
  bots.push(cred);
  console.log(`Created bot ${i}: ${email}`);
}

(async () => {
  try {
    for (let i = 1; i <= 30; i++) {
      // stagger slightly to avoid burst
      // eslint-disable-next-line no-await-in-loop
      await createBot(i);
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify({ created_at: new Date().toISOString(), bots }, null, 2));
    console.log(`Wrote ${OUT_FILE}`);
  } catch (err) {
    console.error('ERROR creating bots:', err.message || err);
    process.exit(2);
  }
})();
