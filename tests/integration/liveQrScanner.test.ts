import { describe, it, expect } from 'vitest';
import {
  evaluateScanGate,
  nextGateState,
  classifyScan,
  filterScanHistory,
  sortScanHistory,
  paginate,
  buildHistoryView,
  isSameLocalDay,
  isWithinThisWeek,
  subscriptionStatusLabel,
  formatExpiryDate,
  buildSubscriptionLines,
  DEFAULT_COOLDOWN_MS,
  DUPLICATE_WINDOW_MS,
  type GateState,
  type ScanHistoryRow,
  type ActiveSubscriptionInfo,
} from '../../src/utils/liveScannerLogic';

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
const emptyGate = (): GateState => ({ lastAcceptedAt: null, lastValue: null, lastValueAt: null });

function makeRow(partial: Partial<ScanHistoryRow> & { id: string }): ScanHistoryRow {
  return {
    id: partial.id,
    user_id: partial.user_id ?? 'u1',
    qr_code: partial.qr_code ?? 'token123',
    user_name: partial.user_name ?? 'Γιώργος Παπαδόπουλος',
    scan_result: partial.scan_result ?? 'PASS',
    subscription_status: partial.subscription_status ?? 'active',
    category: partial.category ?? 'free_gym',
    reason: partial.reason ?? 'ok',
    scanned_by: partial.scanned_by ?? 'sec1',
    scan_time: partial.scan_time ?? '2025-01-01T10:00:00.000Z',
    created_at: partial.created_at ?? '2025-01-01T10:00:00.000Z',
  };
}

// =====================================================================
// 1) Scan gate — cooldown + duplicate suppression
// =====================================================================
describe('evaluateScanGate', () => {
  it('accepts the first scan when gate is empty', () => {
    const d = evaluateScanGate('abc', 1000, emptyGate());
    expect(d.accept).toBe(true);
  });

  it('rejects identical value within duplicate window', () => {
    let gate = emptyGate();
    const t0 = 10_000;
    expect(evaluateScanGate('abc', t0, gate).accept).toBe(true);
    gate = nextGateState('abc', t0);
    const d = evaluateScanGate('abc', t0 + 1000, gate);
    expect(d.accept).toBe(false);
    expect(d.reason).toBe('duplicate');
  });

  it('rejects a different value still inside cooldown', () => {
    let gate = emptyGate();
    const t0 = 10_000;
    gate = nextGateState('abc', t0);
    const d = evaluateScanGate('xyz', t0 + 1000, gate); // 1s < 3s cooldown
    expect(d.accept).toBe(false);
    expect(d.reason).toBe('cooldown');
  });

  it('accepts a different value once cooldown elapsed', () => {
    let gate = emptyGate();
    const t0 = 10_000;
    gate = nextGateState('abc', t0);
    const d = evaluateScanGate('xyz', t0 + DEFAULT_COOLDOWN_MS + 1, gate);
    expect(d.accept).toBe(true);
  });

  it('accepts same value again after duplicate window AND cooldown elapse', () => {
    let gate = emptyGate();
    const t0 = 10_000;
    gate = nextGateState('abc', t0);
    const later = t0 + Math.max(DEFAULT_COOLDOWN_MS, DUPLICATE_WINDOW_MS) + 1;
    const d = evaluateScanGate('abc', later, gate);
    expect(d.accept).toBe(true);
  });

  it('respects custom cooldown / duplicate windows', () => {
    let gate = emptyGate();
    gate = nextGateState('abc', 0);
    expect(evaluateScanGate('xyz', 500, gate, 1000).accept).toBe(false);
    expect(evaluateScanGate('xyz', 1001, gate, 1000).accept).toBe(true);
  });
});

// =====================================================================
// 2) Continuous-operation simulation (stress) through the gate
// =====================================================================
describe('continuous scanning simulation', () => {
  it('accepts exactly one scan per cooldown window across a long stream', () => {
    let gate = emptyGate();
    let accepted = 0;
    // Simulate the camera firing the SAME-ish callback every 100ms for 5 minutes,
    // with users changing every 4 seconds.
    const stepMs = 100;
    const totalMs = 5 * 60 * 1000; // 5 minutes
    for (let t = 0; t <= totalMs; t += stepMs) {
      const userIndex = Math.floor(t / 4000); // new user every 4s
      const value = `user-${userIndex}`;
      const d = evaluateScanGate(value, t, gate);
      if (d.accept) {
        accepted++;
        gate = nextGateState(value, t);
      }
    }
    // Over 300s with a 4s user cadence and 3s cooldown we expect ~one accept
    // per user (75 users) — never an accept on every 100ms frame.
    expect(accepted).toBeGreaterThan(50);
    expect(accepted).toBeLessThan(90);
  });

  it('never accepts two scans closer than the cooldown', () => {
    let gate = emptyGate();
    const acceptedTimes: number[] = [];
    for (let i = 0; i < 10_000; i++) {
      const t = i * 7; // 7ms frames
      const value = `v-${i % 5}`;
      const d = evaluateScanGate(value, t, gate);
      if (d.accept) {
        acceptedTimes.push(t);
        gate = nextGateState(value, t);
      }
    }
    for (let i = 1; i < acceptedTimes.length; i++) {
      expect(acceptedTimes[i] - acceptedTimes[i - 1]).toBeGreaterThanOrEqual(DEFAULT_COOLDOWN_MS);
    }
  });
});

// =====================================================================
// 3) classifyScan — PASS / DENIED / INVALID
// =====================================================================
describe('classifyScan', () => {
  it('INVALID when QR not found', () => {
    const c = classifyScan({
      qrFound: false,
      qrExpired: false,
      hasActiveMembership: false,
      hasPersonalTraining: false,
    });
    expect(c.result).toBe('INVALID');
    expect(c.subscriptionStatus).toBe('invalid');
  });

  it('DENIED when QR expired (even if membership active)', () => {
    const c = classifyScan({
      qrFound: true,
      qrExpired: true,
      hasActiveMembership: true,
      hasPersonalTraining: false,
    });
    expect(c.result).toBe('DENIED');
    expect(c.subscriptionStatus).toBe('expired');
  });

  it('PASS with active membership', () => {
    const c = classifyScan({
      qrFound: true,
      qrExpired: false,
      hasActiveMembership: true,
      hasPersonalTraining: false,
    });
    expect(c.result).toBe('PASS');
    expect(c.subscriptionStatus).toBe('active');
  });

  it('PASS with personal training when no membership', () => {
    const c = classifyScan({
      qrFound: true,
      qrExpired: false,
      hasActiveMembership: false,
      hasPersonalTraining: true,
    });
    expect(c.result).toBe('PASS');
    expect(c.subscriptionStatus).toBe('personal_training');
  });

  it('DENIED when found, not expired, but no eligibility', () => {
    const c = classifyScan({
      qrFound: true,
      qrExpired: false,
      hasActiveMembership: false,
      hasPersonalTraining: false,
    });
    expect(c.result).toBe('DENIED');
    expect(c.subscriptionStatus).toBe('none');
  });

  // Exhaustive truth table (16 combinations) — every branch deterministic.
  const bools = [false, true];
  let caseIdx = 0;
  for (const qrFound of bools)
    for (const qrExpired of bools)
      for (const hasActiveMembership of bools)
        for (const hasPersonalTraining of bools) {
          caseIdx++;
          it(`truth-table [${caseIdx}] f=${qrFound} e=${qrExpired} m=${hasActiveMembership} p=${hasPersonalTraining}`, () => {
            const c = classifyScan({ qrFound, qrExpired, hasActiveMembership, hasPersonalTraining });
            expect(['PASS', 'DENIED', 'INVALID']).toContain(c.result);
            if (!qrFound) expect(c.result).toBe('INVALID');
            else if (qrExpired) expect(c.result).toBe('DENIED');
            else if (hasActiveMembership || hasPersonalTraining) expect(c.result).toBe('PASS');
            else expect(c.result).toBe('DENIED');
          });
        }
});

// =====================================================================
// 4) History filtering
// =====================================================================
describe('filterScanHistory', () => {
  const now = new Date('2025-01-15T12:00:00.000Z'); // Wednesday
  const rows: ScanHistoryRow[] = [
    makeRow({ id: '1', scan_result: 'PASS', user_name: 'Anna', scan_time: '2025-01-15T09:00:00.000Z' }),
    makeRow({ id: '2', scan_result: 'DENIED', user_name: 'Bob', scan_time: '2025-01-14T09:00:00.000Z' }),
    makeRow({ id: '3', scan_result: 'INVALID', user_name: 'Carol', user_id: null, scan_time: '2025-01-01T09:00:00.000Z' }),
    makeRow({ id: '4', scan_result: 'PASS', user_name: 'Dan', user_id: 'u9', scan_time: '2025-01-13T09:00:00.000Z' }),
  ];

  it('filters by result', () => {
    const r = filterScanHistory(rows, { result: 'PASS' }, now);
    expect(r.map((x) => x.id).sort()).toEqual(['1', '4']);
  });

  it('ALL returns everything', () => {
    expect(filterScanHistory(rows, { result: 'ALL' }, now)).toHaveLength(4);
  });

  it('filters TODAY', () => {
    const r = filterScanHistory(rows, { date: 'TODAY' }, now);
    expect(r.map((x) => x.id)).toEqual(['1']);
  });

  it('filters this WEEK (Mon 13 - Sun 19)', () => {
    const r = filterScanHistory(rows, { date: 'WEEK' }, now);
    expect(r.map((x) => x.id).sort()).toEqual(['1', '2', '4']);
  });

  it('filters by specific user', () => {
    const r = filterScanHistory(rows, { userId: 'u9' }, now);
    expect(r.map((x) => x.id)).toEqual(['4']);
  });

  it('free-text search matches name (case-insensitive)', () => {
    expect(filterScanHistory(rows, { search: 'ann' }, now).map((x) => x.id)).toEqual(['1']);
  });

  it('search matches subscription_status', () => {
    const r = filterScanHistory(rows, { search: 'active' }, now);
    expect(r.length).toBeGreaterThan(0);
  });

  it('combined filters (PASS + WEEK + search)', () => {
    const r = filterScanHistory(rows, { result: 'PASS', date: 'WEEK', search: 'dan' }, now);
    expect(r.map((x) => x.id)).toEqual(['4']);
  });
});

// =====================================================================
// 5) Sorting
// =====================================================================
describe('sortScanHistory', () => {
  const rows: ScanHistoryRow[] = [
    makeRow({ id: 'a', user_name: 'Zoe', scan_result: 'PASS', scan_time: '2025-01-10T10:00:00.000Z' }),
    makeRow({ id: 'b', user_name: 'Alex', scan_result: 'DENIED', scan_time: '2025-01-12T10:00:00.000Z' }),
    makeRow({ id: 'c', user_name: 'Mike', scan_result: 'INVALID', scan_time: '2025-01-11T10:00:00.000Z' }),
  ];

  it('sorts by scan_time desc by default', () => {
    expect(sortScanHistory(rows).map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by scan_time asc', () => {
    expect(sortScanHistory(rows, 'scan_time', 'asc').map((r) => r.id)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by user_name asc', () => {
    expect(sortScanHistory(rows, 'user_name', 'asc').map((r) => r.user_name)).toEqual([
      'Alex',
      'Mike',
      'Zoe',
    ]);
  });

  it('sorts by scan_result asc', () => {
    expect(sortScanHistory(rows, 'scan_result', 'asc').map((r) => r.scan_result)).toEqual([
      'DENIED',
      'INVALID',
      'PASS',
    ]);
  });

  it('does not mutate the source array', () => {
    const copy = [...rows];
    sortScanHistory(rows, 'user_name', 'asc');
    expect(rows).toEqual(copy);
  });
});

// =====================================================================
// 6) Pagination
// =====================================================================
describe('paginate', () => {
  const rows = Array.from({ length: 23 }).map((_, i) => makeRow({ id: `r${i}` }));

  it('returns the correct page slice', () => {
    const p = paginate(rows, 1, 8);
    expect(p.items).toHaveLength(8);
    expect(p.totalPages).toBe(3);
    expect(p.totalItems).toBe(23);
  });

  it('last page has the remainder', () => {
    const p = paginate(rows, 3, 8);
    expect(p.items).toHaveLength(7);
    expect(p.page).toBe(3);
  });

  it('clamps page above range to last page', () => {
    const p = paginate(rows, 99, 8);
    expect(p.page).toBe(3);
  });

  it('clamps page below 1 to page 1', () => {
    const p = paginate(rows, 0, 8);
    expect(p.page).toBe(1);
  });

  it('handles empty input', () => {
    const p = paginate([], 1, 8);
    expect(p.items).toHaveLength(0);
    expect(p.totalPages).toBe(1);
    expect(p.totalItems).toBe(0);
  });

  it('handles invalid pageSize gracefully', () => {
    const p = paginate(rows, 1, 0);
    expect(p.pageSize).toBe(1);
    expect(p.totalPages).toBe(23);
  });
});

// =====================================================================
// 7) End-to-end view builder
// =====================================================================
describe('buildHistoryView', () => {
  const now = new Date('2025-01-15T12:00:00.000Z');
  const rows: ScanHistoryRow[] = Array.from({ length: 20 }).map((_, i) =>
    makeRow({
      id: `e${i}`,
      scan_result: i % 3 === 0 ? 'PASS' : i % 3 === 1 ? 'DENIED' : 'INVALID',
      user_name: `User ${String.fromCharCode(65 + (i % 26))}`,
      scan_time: new Date(now.getTime() - i * 60_000).toISOString(),
    })
  );

  it('filters + sorts + paginates together', () => {
    const v = buildHistoryView(
      rows,
      { result: 'PASS' },
      { field: 'scan_time', dir: 'desc' },
      1,
      3,
      now
    );
    expect(v.items.every((r) => r.scan_result === 'PASS')).toBe(true);
    expect(v.items.length).toBeLessThanOrEqual(3);
    expect(v.page).toBe(1);
  });

  it('returns empty view when nothing matches', () => {
    const v = buildHistoryView(
      rows,
      { search: '___nomatch___' },
      { field: 'scan_time', dir: 'desc' },
      1,
      5,
      now
    );
    expect(v.totalItems).toBe(0);
    expect(v.items).toHaveLength(0);
  });
});

// =====================================================================
// 8) Date helpers
// =====================================================================
describe('date helpers', () => {
  it('isSameLocalDay true/false', () => {
    expect(isSameLocalDay(new Date('2025-01-15T01:00:00'), new Date('2025-01-15T23:00:00'))).toBe(true);
    expect(isSameLocalDay(new Date('2025-01-15T01:00:00'), new Date('2025-01-16T01:00:00'))).toBe(false);
  });

  it('isWithinThisWeek (Mon-based)', () => {
    const ref = new Date('2025-01-15T12:00:00'); // Wednesday
    expect(isWithinThisWeek(new Date('2025-01-13T00:00:00'), ref)).toBe(true); // Monday
    expect(isWithinThisWeek(new Date('2025-01-19T23:59:00'), ref)).toBe(true); // Sunday
    expect(isWithinThisWeek(new Date('2025-01-20T00:00:00'), ref)).toBe(false); // next Monday
    expect(isWithinThisWeek(new Date('2025-01-12T23:59:00'), ref)).toBe(false); // prev Sunday
  });
});

// =====================================================================
// 9) Labels
// =====================================================================
describe('subscriptionStatusLabel', () => {
  it('maps known statuses to Greek', () => {
    expect(subscriptionStatusLabel('active')).toBe('Ενεργή');
    expect(subscriptionStatusLabel('expired')).toBe('Ληγμένη');
    expect(subscriptionStatusLabel('none')).toBe('Καμία');
    expect(subscriptionStatusLabel('personal_training')).toBe('Personal Training');
    expect(subscriptionStatusLabel('invalid')).toBe('Μη έγκυρο');
  });

  it('falls back to raw value / dash', () => {
    expect(subscriptionStatusLabel('weird')).toBe('weird');
    expect(subscriptionStatusLabel(null)).toBe('—');
  });
});

// =====================================================================
// 10) Subscription expiry dates (single + multiple)
// =====================================================================
describe('formatExpiryDate', () => {
  it('formats a YYYY-MM-DD date to el-GR dd/mm/yyyy', () => {
    expect(formatExpiryDate('2025-12-31')).toBe('31/12/2025');
  });

  it('formats a full ISO timestamp', () => {
    expect(formatExpiryDate('2026-01-15T00:00:00.000Z')).toBe('15/01/2026');
  });

  it('returns dash for null / empty / invalid', () => {
    expect(formatExpiryDate(null)).toBe('—');
    expect(formatExpiryDate('')).toBe('—');
    expect(formatExpiryDate('not-a-date')).toBe('—');
  });
});

describe('buildSubscriptionLines', () => {
  it('builds a line with expiry for a single subscription', () => {
    const subs: ActiveSubscriptionInfo[] = [{ packageName: 'Free Gym', endDate: '2025-12-31' }];
    expect(buildSubscriptionLines(subs)).toEqual(['Free Gym — Λήξη 31/12/2025']);
  });

  it('builds multiple lines for multiple active subscriptions', () => {
    const subs: ActiveSubscriptionInfo[] = [
      { packageName: 'Free Gym', endDate: '2025-12-31' },
      { packageName: 'Pilates', endDate: '2026-01-15' },
    ];
    expect(buildSubscriptionLines(subs)).toEqual([
      'Free Gym — Λήξη 31/12/2025',
      'Pilates — Λήξη 15/01/2026',
    ]);
  });

  it('omits expiry when endDate is null (e.g. personal training)', () => {
    const subs: ActiveSubscriptionInfo[] = [{ packageName: 'Personal Training', endDate: null }];
    expect(buildSubscriptionLines(subs)).toEqual(['Personal Training']);
  });

  it('handles empty array', () => {
    expect(buildSubscriptionLines([])).toEqual([]);
  });
});
