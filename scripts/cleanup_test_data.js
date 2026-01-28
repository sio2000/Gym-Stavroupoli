const fs = require('fs');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config({ path: process.env.ENV_FILE || '.env.testbots' });

const API_BASE = process.env.API_BASE_URL;
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
const BOTS_FILE = process.env.TEST_BOTS_FILE || './.testbots_credentials.json';
const CONFIRM = process.env.CONFIRM_RUN;

if (CONFIRM !== 'YES_I_CONFIRM') {
  console.error('Refusing to run cleanup. Set CONFIRM_RUN=YES_I_CONFIRM in .env.testbots to proceed.');
  process.exit(1);
}

if (!fs.existsSync(BOTS_FILE)) {
  console.error(`${BOTS_FILE} not found, nothing to cleanup`);
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(BOTS_FILE));
const bots = data.bots || [];

const adminDelete = async (path) => {
  const res = await fetch(`${API_BASE.replace(/\/$/, '')}${path}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  return res.ok;
};

(async () => {
  for (const b of bots) {
    try {
      // delete subscriptions for user (best-effort)
      await adminDelete(`/admin/users/${b.userId}/subscriptions`);
      await adminDelete(`/admin/users/${b.userId}`);
      console.log(`Deleted bot user ${b.userId} (${b.email})`);
    } catch (err) {
      console.error('Error deleting bot', b.userId, err.message || err);
    }
  }
  // optionally archive credentials
  fs.renameSync(BOTS_FILE, `${BOTS_FILE}.deleted.${Date.now()}`);
  console.log('Cleanup complete');
})();
