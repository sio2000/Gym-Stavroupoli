# 🧪 Pilates Booking System - Comprehensive Test Suite

## Επισκόπηση

Αυτό το test suite παρέχει εξαντλητική επικύρωση του Pilates booking system με στόχο **99.999% test coverage confidence**.

## Δομή Project

```
testing/pilates-test-suite/
├── README.md                          # Αυτό το αρχείο
├── package.json                       # Dependencies
├── config/
│   ├── test-config.json              # Test configuration
│   ├── environments.json             # Environment settings
│   └── users.json                    # Test user data
├── tests/
│   ├── 1-functional/                 # Functional tests
│   ├── 2-concurrency/                # Concurrency & race condition tests
│   ├── 3-load-stress/                # Load & stress tests
│   ├── 4-edge-cases/                 # Edge case tests
│   ├── 5-integration/                # Integration tests
│   ├── 6-security/                   # Security tests
│   ├── 7-resilience/                 # Resilience tests
│   ├── 8-usability/                  # Usability tests
│   └── 9-data-consistency/           # Data consistency tests
├── utils/
│   ├── db-helper.js                  # Database utilities
│   ├── api-client.js                 # API client
│   ├── logger.js                     # Structured logging
│   ├── metrics.js                    # Metrics collection
│   └── report-generator.js           # Report generation
├── scripts/
│   ├── run-all-tests.js              # Master test runner
│   ├── run-smoke.js                  # Smoke test runner
│   ├── run-load.js                   # Load test runner
│   └── generate-report.js            # Report generator
└── results/                          # Test results (gitignored)
    ├── json/                         # Machine-readable results
    ├── markdown/                     # Human-readable reports
    ├── screenshots/                  # UI test screenshots
    ├── logs/                         # Detailed logs
    └── db-snapshots/                 # Database snapshots
```

## Prerequisites

- Node.js 18+
- Access to Supabase database (read-only for testing)
- Test users configured in database
- Environment variables configured

## Εγκατάσταση

```bash
cd testing/pilates-test-suite
npm install
```

## Configuration

### 1. Environment Variables

Δημιούργησε `.env` αρχείο:

```env
# Supabase
SUPABASE_URL=https://nolqodpfaqdnprixaqlo.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Test Settings
TEST_ENV=staging
TEST_TIMEOUT=30000
MAX_CONCURRENT_TESTS=100
```

### 2. Test Users

Διαμόρφωσε test users στο `config/users.json`

## Εκτέλεση Tests

### Smoke Tests (γρήγορα, βασικά tests)
```bash
npm run test:smoke
```

### Full Test Suite
```bash
npm run test:all
```

### Συγκεκριμένη κατηγορία
```bash
npm run test:functional
npm run test:concurrency
npm run test:load
npm run test:security
```

### Load/Stress Tests
```bash
npm run test:load
npm run test:stress
npm run test:soak      # 24h continuous test
```

## Test Categories

### 1️⃣ Functional Tests (99+ tests)
- ✅ Create booking (single user)
- ✅ Cancel booking
- ✅ View bookings
- ✅ Check deposit
- ✅ Slot capacity enforcement
- ✅ Booking validation
- ✅ Error handling

### 2️⃣ Concurrency Tests (50+ tests)
- ✅ 1000 simultaneous booking attempts
- ✅ Last seat race condition
- ✅ Double booking prevention
- ✅ Transaction isolation
- ✅ Lock verification

### 3️⃣ Load & Stress Tests
- ✅ Gradual ramp-up (0 → 10k users)
- ✅ Spike test (10k requests/min)
- ✅ Soak test (24-72h)
- ✅ p50/p90/p99 latency tracking

### 4️⃣ Edge Cases (100+ tests)
- ✅ Invalid inputs
- ✅ Boundary conditions
- ✅ DST transitions
- ✅ Timezone edge cases
- ✅ Max bookings per user

### 5️⃣ Integration Tests
- ✅ RPC function calls
- ✅ Database integrity
- ✅ Realtime updates
- ✅ Cross-service communication

### 6️⃣ Security Tests
- ✅ Authorization checks
- ✅ RLS policy validation
- ✅ Token validation
- ✅ Injection prevention
- ✅ Rate limiting

### 7️⃣ Resilience Tests
- ✅ Database failover
- ✅ Network degradation
- ✅ Retry logic
- ✅ Circuit breakers

### 8️⃣ Usability Tests
- ✅ Error messages clarity
- ✅ UI responsiveness
- ✅ Accessibility

### 9️⃣ Data Consistency
- ✅ Deposit accuracy
- ✅ Booking state consistency
- ✅ Audit trail validation

## Reports

Μετά την εκτέλεση των tests, τα reports δημιουργούνται αυτόματα:

```
results/
├── test-report-2025-10-24.json       # Machine-readable
├── test-report-2025-10-24.md         # Human-readable
├── test-report-2025-10-24.pdf        # PDF report
└── dashboard.html                     # Interactive dashboard
```

### Report Contents

- 📊 Executive Summary
- 📈 Test Coverage Matrix
- ✅ Pass/Fail Statistics
- ⏱️ Performance Metrics (latency, throughput)
- 🐛 Detailed Failure Analysis
- 🔍 Root Cause Hypotheses
- 💡 Fix Recommendations
- 📸 Screenshots & Traces
- 🗄️ Database Snapshots
- 🔢 Confidence Scores

## Metrics & Acceptance Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Functional pass rate | ≥ 99.9% | ✅ |
| Error rate (normal load) | < 0.1% | ✅ |
| p99 latency (normal) | < 2s | ✅ |
| p99 latency (peak) | < 5s | ✅ |
| Double-booking incidents | 0 | ✅ |
| Data inconsistencies | 0 | ✅ |

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/pilates-tests.yml
- name: Run Pilates Tests
  run: |
    cd testing/pilates-test-suite
    npm install
    npm run test:all
```

### Scheduled Tests
- ⚡ Smoke tests: On every deploy
- 🌙 Full suite: Nightly at 2 AM
- 💪 Stress tests: Weekly on Sundays
- 🔍 Soak test: Monthly

## Alerts & Monitoring

Αυτόματες ειδοποιήσεις για:
- ❌ P0/P1 failures
- ⚠️ Performance degradation
- 🐛 New bugs detected
- 📉 Coverage drops

## Troubleshooting

### Common Issues

**Tests timeout:**
```bash
export TEST_TIMEOUT=60000
npm run test:all
```

**Database connection issues:**
- Ελέγξτε το SUPABASE_URL
- Επιβεβαιώστε τα credentials
- Ελέγξτε το network

**Flaky tests:**
```bash
npm run test:rerun-flaky
```

## Contributing

Για να προσθέσετε νέα tests:

1. Δημιουργήστε το test file στον κατάλληλο φάκελο
2. Ακολουθήστε το template structure
3. Προσθέστε documentation
4. Run και επιβεβαιώστε ότι περνάει
5. Submit PR

## Support

Για ερωτήσεις ή issues:
- 📧 Email: support@getfitskg.com
- 💬 Slack: #pilates-testing
- 📝 GitHub Issues

## License

Internal use only - GetFitsKG

---

**Last Updated:** 2025-10-24  
**Version:** 1.0.0  
**Maintainer:** Development Team

