Safety-first E2E testing scaffold

Overview
- This folder contains a Playwright-based E2E scaffold and scripts to create 30 QA bot users and run safety-first end-to-end tests.

Critical safety rules (must read before running)
- NEVER run these scripts without configuring and verifying environment variables.
- Only test with bot users created by `scripts/create_test_bots.js`.
- All test actions perform safety asserts via `utils/safety.js`. If a safety assert fails the run stops with `SAFETY STOP: Attempted action on non-test user.`
- You MUST set `CONFIRM_RUN=YES_I_CONFIRM` to avoid accidental execution against production.

Quick start
1. Copy `.env.testbots.example` to `.env.testbots` and fill values (ADMIN_API_TOKEN, API_BASE_URL, etc.).
2. Install deps:
```bash
npm install
npm run install:playwright
```
3. Create bots (will write `.env.testbots` credentials file):
```bash
npm run create-bots
```
4. Run tests:
```bash
npm test
```
5. Cleanup test data:
```bash
npm run cleanup
```

Notes
- Endpoints used by the scripts are configurable via `API_BASE_URL` and `ADMIN_API_TOKEN`.
- The scripts are intentionally conservative: they require `CONFIRM_RUN` and a test time window to prevent accidental runs.
