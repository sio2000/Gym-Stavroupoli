# 🧪 Pilates Booking System - 1000+ Test Suite

**Objective:** Run 1,000+ realistic end-to-end tests to **prove** that the booking bug is fixed:
> "Users lost classes (removed from deposit) but bookings were NOT recorded in pilates calendar"

## 🎯 Test Goals

### Primary Goal
Detect **any case** where:
- ❌ User's booking is removed/changed
- ❌ BUT booking is NOT reflected in `pilates_bookings` table
- ❌ OR `pilates_schedule_slots` occupancy is incorrect
- ❌ OR `user_profiles` deposit is inconsistent

### Acceptance Criteria (STRICT)
- ✅ **Zero occurrences** of booking removal without calendar write
- ✅ **All tests** produce structured logs + DB snapshots
- ✅ **Any failure** = P0 with full reproduction steps
- ✅ **99.999% confidence** that bug is fixed

## 📊 Test Coverage

### Test Matrix (1,000+ permutations)

```
50 users × 5 devices × 4 timezones × 10 actions × 2 states = 20,000 combinations
→ Stratified sample of 1,000–2,000 tests
```

**Dimensions:**
- **Users:** 50 different profiles (normal, edge-case, admin)
- **Devices:** Android, iOS, Web (Chrome/Firefox/Safari), API
- **Timezones:** Europe/Athens, UTC, US/Eastern, Asia/Tokyo
- **Actions:** book, cancel, reschedule, admin_remove, concurrent
- **Network:** normal, high-latency, packet-loss, failure-injection

## 🏗️ Architecture

```
testing/pilates-1000-tests/
├── README.md                          # This file
├── package.json                       # Dependencies
├── config/
│   ├── test-matrix.json              # Test permutations
│   ├── users.json                    # 50 test users
│   └── environments.json             # Test environments
├── generators/
│   ├── test-case-generator.js        # Generates 1000+ tests
│   ├── user-generator.js             # Generates test users
│   └── scenario-builder.js           # Builds test scenarios
├── runners/
│   ├── master-runner.js              # Runs all 1000+ tests
│   ├── parallel-runner.js            # Parallel execution
│   └── sequential-runner.js          # Sequential execution
├── verifiers/
│   ├── db-verifier.js                # DB consistency checks
│   ├── snapshot-manager.js           # Before/after snapshots
│   └── audit-logger.js               # Audit trail verification
├── injectors/
│   ├── failure-injector.js           # Simulates partial failures
│   ├── network-injector.js           # Network glitches
│   └── concurrency-injector.js       # Race conditions
├── utils/
│   ├── db-helper.js                  # Database utilities
│   ├── api-client.js                 # API client with tracing
│   ├── logger.js                     # Structured logging
│   └── reporter.js                   # Report generation
├── results/
│   ├── test-cases/                   # Generated test cases
│   ├── logs/                         # Execution logs
│   ├── snapshots/                    # DB snapshots
│   ├── failures/                     # Failure artifacts
│   └── reports/                      # Final reports
└── scripts/
    ├── generate-tests.js             # Generate 1000+ test cases
    ├── run-all.js                    # Run all tests
    ├── run-subset.js                 # Run subset (fast)
    └── analyze-results.js            # Analyze & report
```

## 🚀 Quick Start

### 1. Generate 1000+ Test Cases
```bash
npm run generate:tests
# Output: results/test-cases/test-matrix-1000.json
```

### 2. Run All Tests
```bash
npm run test:all
# Runs 1000+ tests in parallel
# Duration: ~30-60 minutes
```

### 3. Generate Report
```bash
npm run report
# Output: results/reports/final-report.md
```

## 📋 Test Case Format

Each test case includes:

```json
{
  "test_id": "T-000001",
  "seed": 12345,
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "env": "staging",
  "user": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "role": "user",
    "has_deposit": true,
    "deposit_amount": 10
  },
  "device": "android",
  "timezone": "Europe/Athens",
  "class": {
    "slot_id": "789e0123-e45b-67c8-d901-234567890abc",
    "date": "2025-10-25",
    "time": "10:00",
    "capacity": 4
  },
  "action": "book_and_cancel",
  "sequence": [
    {"step": 1, "action": "book", "expected": "success"},
    {"step": 2, "action": "verify_booking", "expected": "exists"},
    {"step": 3, "action": "cancel", "expected": "success"},
    {"step": 4, "action": "verify_removal", "expected": "removed"}
  ],
  "concurrent_actors": [],
  "network_condition": "normal",
  "failure_injection": null,
  "assertions": [
    "booking_exists_after_book",
    "deposit_decremented_after_book",
    "booking_removed_after_cancel",
    "deposit_restored_after_cancel",
    "calendar_consistent",
    "no_dangling_references"
  ]
}
```

## 🔍 Verification Checks

### Per-Test Assertions

**1. Booking Table Consistency**
```sql
-- After booking: verify exists
SELECT * FROM pilates_bookings 
WHERE id = :booking_id AND status = 'confirmed';

-- After cancel: verify removed/cancelled
SELECT * FROM pilates_bookings 
WHERE id = :booking_id AND status = 'cancelled';
```

**2. Calendar Consistency**
```sql
-- Verify booking count matches
SELECT slot_id, COUNT(*) as count
FROM pilates_bookings
WHERE slot_id = :slot_id AND status = 'confirmed'
GROUP BY slot_id;

-- Compare with occupancy view
SELECT * FROM pilates_slots_with_occupancy
WHERE slot_id = :slot_id;
```

**3. Deposit Consistency**
```sql
-- Verify deposit matches bookings
SELECT 
  d.deposit_remaining,
  COUNT(b.id) as active_bookings
FROM pilates_deposits d
LEFT JOIN pilates_bookings b ON d.user_id = b.user_id AND b.status = 'confirmed'
WHERE d.user_id = :user_id
GROUP BY d.deposit_remaining;
```

**4. No Dangling References**
```sql
-- Bookings without valid users
SELECT b.* FROM pilates_bookings b
LEFT JOIN user_profiles u ON b.user_id = u.user_id
WHERE u.user_id IS NULL;

-- Bookings without valid slots
SELECT b.* FROM pilates_bookings b
LEFT JOIN pilates_schedule_slots s ON b.slot_id = s.id
WHERE s.id IS NULL;
```

### Cross-Check Queries

```sql
-- Reconciliation: deposits vs bookings
SELECT 
  u.user_id,
  d.deposit_remaining,
  COUNT(b.id) as active_bookings,
  (d.deposit_remaining + COUNT(b.id)) as should_be_original
FROM user_profiles u
LEFT JOIN pilates_deposits d ON u.user_id = d.user_id
LEFT JOIN pilates_bookings b ON u.user_id = b.user_id AND b.status = 'confirmed'
WHERE d.is_active = true
GROUP BY u.user_id, d.deposit_remaining;
```

## 📊 Logging & Traceability

### Structured Logs (JSON)

```json
{
  "timestamp": "2025-10-24T10:30:45.123Z",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "test_id": "T-000001",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "device": "android",
  "env": "staging",
  "action": "book",
  "request": {
    "method": "POST",
    "url": "/api/rpc/book_pilates_class",
    "body": {"p_user_id": "...", "p_slot_id": "..."}
  },
  "response": {
    "status": 200,
    "latency_ms": 145,
    "body": {"booking_id": "...", "deposit_remaining": 9}
  },
  "db_snapshot_before": "snapshots/T-000001-before.json",
  "db_snapshot_after": "snapshots/T-000001-after.json",
  "assertions": {
    "booking_exists": true,
    "deposit_decremented": true,
    "calendar_updated": true
  },
  "status": "PASS"
}
```

### DB Snapshots

```json
{
  "snapshot_id": "T-000001-before",
  "timestamp": "2025-10-24T10:30:45.000Z",
  "user": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "deposit_remaining": 10
  },
  "bookings": [],
  "slot_occupancy": 0
}
```

## 🎯 Priority Test Scenarios

### 1. Known Bug Pattern (HIGH PRIORITY)
Test the **exact failure pattern** that caused the original bug:

```javascript
// Scenario: Booking removed but calendar not updated
{
  test_id: "T-BUG-001",
  scenario: "partial_write_failure",
  steps: [
    "Book class → Success",
    "Inject failure: Calendar service returns 500",
    "Cancel booking → Should rollback OR mark inconsistent",
    "Verify: Either booking still exists OR audit log created"
  ],
  failure_injection: {
    type: "calendar_service_failure",
    timing: "after_deposit_deduction"
  }
}
```

### 2. Concurrent Operations (HIGH PRIORITY)
```javascript
{
  test_id: "T-CONC-001",
  scenario: "concurrent_cancel_and_book",
  concurrent_actors: [
    {actor: "user", action: "cancel", delay_ms: 0},
    {actor: "admin", action: "remove", delay_ms: 10}
  ]
}
```

### 3. Multi-Device (MEDIUM PRIORITY)
```javascript
{
  test_id: "T-MULTI-001",
  scenario: "web_and_mobile_conflict",
  devices: ["web", "mobile"],
  actions: [
    {device: "web", action: "cancel", timestamp: "T+0ms"},
    {device: "mobile", action: "confirm", timestamp: "T+50ms"}
  ]
}
```

## 📈 Performance Targets

| Metric | Target | Acceptable |
|--------|--------|------------|
| Total test duration | < 60 min | < 120 min |
| Tests per second | > 1 | > 0.5 |
| DB query latency (p99) | < 2s | < 5s |
| Test flakiness rate | < 1% | < 5% |
| Parallel test workers | 20-50 | 10 |

## 🚨 Failure Handling

### P0 Failures (Critical)
- Booking removed but calendar not updated
- Deposit deducted but booking not created
- Data inconsistency detected

**Required Artifacts:**
- ✅ Full API request/response logs
- ✅ DB snapshots (before/after)
- ✅ Trace ID for full path tracing
- ✅ Reproduction script
- ✅ Root cause hypothesis
- ✅ Suggested fix

### Flaky Tests
- Auto-rerun 3 times
- Correlate with infra metrics
- Mark and investigate separately

## 📋 Final Report Format

```markdown
# Pilates Booking - 1000+ Test Results

## Executive Summary
- Total Tests: 1,247
- Passed: 1,247 (100%)
- Failed: 0 (0%)
- Flaky: 3 (0.24%)
- P0 Failures: 0
- Confidence: 99.999%

## Test Coverage
- Functional: 450 tests
- Concurrency: 250 tests
- Edge Cases: 200 tests
- Failure Injection: 150 tests
- Load/Stress: 197 tests

## P0 Failures
(None detected)

## Recommendations
✅ System is production-ready
```

## 🔧 Commands

```bash
# Generate test cases
npm run generate:tests            # 1000+ tests
npm run generate:tests -- --count 2000  # Custom count

# Run tests
npm run test:all                  # All tests
npm run test:subset -- --count 100  # Quick validation
npm run test:priority             # Only P0/P1 scenarios

# Analysis
npm run analyze                   # Analyze results
npm run report                    # Generate report
npm run replay -- T-000001        # Replay specific test

# Utilities
npm run clean                     # Clean results
npm run verify:db                 # DB consistency check
npm run reconcile                 # Run reconciliation
```

## 🎓 Best Practices

1. **Idempotency:** All test cases use idempotency keys
2. **Isolation:** Each test uses unique data or cleanup
3. **Traceability:** Every action has trace_id
4. **Atomicity:** DB operations are transactional
5. **Verification:** Always check DB state after actions
6. **Cleanup:** Tests cleanup after themselves

---

**Status:** Ready for execution  
**Confidence Target:** 99.999%  
**Estimated Duration:** 30-60 minutes  
**Last Updated:** 2025-10-24

