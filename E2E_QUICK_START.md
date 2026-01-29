# 🚀 E2E TEST SUITE - QUICK START GUIDE

## Current Status: ✅ READY TO USE

**Date:** 2026-01-28  
**Tests Passing:** 7/7 (100%)  
**Test Bots Available:** 30 isolated test users  

---

## 📋 What's Been Done

### ✅ Test Bots Created (30 users)
```bash
npm run create-bots
```
Creates 30 test users in Supabase with safety markers:
- Email: `qa.bot+{timestamp}.{01-30}@example.com`
- Name: `QA BOT {nn} - TEST ONLY`
- Flag: `is_test_user=true`
- Stored in: `.testbots_credentials.json`

### ✅ Subscription Tests (4 tests, 100% passing)
```bash
npx playwright test subscriptions.spec.cjs
```
Tests covered:
1. Create subscription for new user
2. Renew subscription before expiration
3. Upgrade package (Free Gym → Pilates)
4. Verify expiration date correctness (30 days)

### ✅ Bookings & Pilates Tests (3 tests, 100% passing)
```bash
npx playwright test bookings-pilates.spec.cjs
```
Tests covered:
1. Get Pilates package info & availability
2. List pilates lessons (if data exists)
3. Verify gym bookings capability

### ✅ Safety Controls Verified
- All 7 test bots confirmed as test-only
- Safety assertions block real user access
- Zero production data touched
- Test window isolation: 2026-01-28 to 2026-02-28

---

## 🎮 Quick Commands

### Run All Tests
```bash
npx playwright test --project=chromium
```

### Run Specific Test Suite
```bash
npx playwright test subscriptions.spec.cjs
npx playwright test bookings-pilates.spec.cjs
```

### View Test Report
```bash
npx playwright show-report
```

### Create New Test Bots
```bash
npm run create-bots
```

### Clean Up Test Data
```bash
npm run cleanup:testdata
```

---

## 📊 Test Results Summary

| Test | Status | Duration | Bot(s) |
|---|---|---|---|
| Create subscription | ✅ PASS | 1.1s | Bot 01 |
| Renew subscription | ✅ PASS | 1.0s | Bot 02 |
| Upgrade package | ✅ PASS | 1.4s | Bot 03 |
| Verify expiration | ✅ PASS | 639ms | Bot 04 |
| Pilates package info | ✅ PASS | 570ms | Bot 05 |
| List pilates lessons | ✅ PASS | 258ms | Bot 06 |
| Gym bookings capability | ✅ PASS | 473ms | Bot 07 |

**Total:** 7 passed in 5.5 seconds

---

## 🔧 Configuration Files

### `.env.testbots` (Created automatically)
```env
API_BASE_URL=https://nolqodpfaqdnprixaqlo.supabase.co/auth/v1
ADMIN_API_TOKEN=<your-service-role-key>
TEST_RUN_ID=qa-run-20260128
TEST_WINDOW_START=2026-01-28T00:00:00Z
TEST_WINDOW_END=2026-02-28T00:00:00Z
CONFIRM_RUN=YES_I_CONFIRM
TEST_BOTS_FILE=./.testbots_credentials.json
```

### `.testbots_credentials.json` (Generated after create-bots)
Contains 30 bot user credentials with passwords (do not commit!)

### `playwright.config.js`
- Framework: Playwright v1.40.0
- Browser: Chromium (headless)
- Timeout: 120s per test
- Reporter: HTML + List

---

## 🛡️ Safety Features

### Automatic Safety Checks
Every test calls `assertSafety(bot, WINDOW_START, WINDOW_END)` which verifies:
- ✅ User is marked as test user (is_test_user=true) OR
- ✅ Email starts with `qa.bot+` AND name contains `QA BOT` (fallback)
- ✅ User created within test window (if provided)
- ✅ HARD STOPS if non-test user detected

### Test Isolation
- All 30 bots created with safety markers
- Each test uses different bot (Bots 01-07)
- Remaining bots (08-30) available for expansion
- Test data clearly marked in database

### Clean-up
```bash
npm run cleanup:testdata
```
Deletes all test bots and their related data from Supabase.

---

## 🚀 Next Steps

### Phase 2: Expand Coverage
- [ ] Payment/Cashier tests (Bots 08-15)
- [ ] Negative testing (Bots 16-20)
- [ ] Stress testing (Bots 21-25)
- [ ] Cleanup verification (Bots 26-30)

### Phase 3: Evidence Pack
- [ ] Screenshot capture for each test
- [ ] HTML report with coverage matrix
- [ ] Audit trail and logs
- [ ] Confidence arguments document

---

## 📝 File Structure

```
Gym-Stavroupoli/
├── tests/e2e/
│   ├── subscriptions.spec.cjs          ← 4 subscription tests
│   └── bookings-pilates.spec.cjs       ← 3 booking/pilates tests
├── scripts/
│   ├── create_test_bots.cjs            ← Create 30 bots
│   └── cleanup_test_data.cjs           ← Delete test data
├── utils/
│   └── safety.js                       ← Safety assertions
├── playwright.config.js                ← Test framework config
├── .env.testbots                       ← Test env (auto-created)
├── .testbots_credentials.json          ← Bot credentials (auto-created)
├── e2e-test-results.log                ← Latest test output
└── E2E_TEST_REPORT.md                  ← Full report
```

---

## ⚠️ Important Notes

1. **Do not commit** `.env.testbots` or `.testbots_credentials.json` to git
2. **Test window:** Tests only recognize users created 2026-01-28 to 2026-02-28
3. **Real data protection:** All safety checks prevent accidental real user access
4. **Playwright config:** Uses CommonJS (.cjs) due to ESM project type
5. **Pilates tests:** Require pilates_lessons table data to fully execute

---

## 📞 Support

For questions about the test suite:
- Check test files for specific assertions: `tests/e2e/*.spec.cjs`
- Review safety logic: `utils/safety.js`
- See full report: `E2E_TEST_REPORT.md`
- Check config: `playwright.config.js`

---

**Version:** 1.0  
**Status:** ✅ Production Ready  
**Last Updated:** 2026-01-28 23:19:31 UTC
