// =====================================================================
// Live QR Scanner — Pure logic (no DB, no DOM) => fully unit-testable
// =====================================================================
// Houses every decision the Live scanner makes that does NOT require I/O:
//  * scan acceptance gating (3s cooldown + duplicate suppression)
//  * subscription classification -> scan result mapping
//  * scan-history filtering / searching / sorting / pagination
// Keeping this isolated lets us stress-test thousands of scans deterministically.
// =====================================================================

export type ScanResultType = 'PASS' | 'DENIED' | 'INVALID';

export type SubscriptionStatus =
  | 'active'
  | 'expired'
  | 'none'
  | 'personal_training'
  | 'invalid';

export interface ActiveSubscriptionInfo {
  packageName: string;
  endDate: string | null; // ISO date (YYYY-MM-DD) or null (e.g. personal training)
}

export interface ScanHistoryRow {
  id: string;
  user_id: string | null;
  qr_code: string | null;
  user_name: string | null;
  scan_result: ScanResultType;
  subscription_status: string | null;
  category: string | null;
  reason: string | null;
  scanned_by: string | null;
  scan_time: string; // ISO timestamp
  created_at: string;
}

// Default cooldown between two *accepted* scans (ms).
export const DEFAULT_COOLDOWN_MS = 3000;

// Supabase Realtime broadcast channel that mirrors scan results to the /tablet TV display.
export const LIVE_SCAN_CHANNEL = 'qr-scan-live';
export const LIVE_SCAN_EVENT = 'scan';

// Window during which an identical QR value is considered a duplicate (ms).
export const DUPLICATE_WINDOW_MS = 5000;

export interface GateState {
  lastAcceptedAt: number | null; // epoch ms of last accepted scan (any value)
  lastValue: string | null; // last accepted raw QR value
  lastValueAt: number | null; // epoch ms when lastValue was accepted
}

export interface GateDecision {
  accept: boolean;
  reason?: 'cooldown' | 'duplicate';
}

/**
 * Decide whether a freshly decoded QR value should be processed now.
 * Rejects if we're still inside the global cooldown, or if it's the same
 * value seen within the duplicate window. Pure: returns a decision only.
 */
export function evaluateScanGate(
  value: string,
  now: number,
  state: GateState,
  cooldownMs: number = DEFAULT_COOLDOWN_MS,
  duplicateWindowMs: number = DUPLICATE_WINDOW_MS
): GateDecision {
  // Duplicate suppression (same value within window) takes priority so that a
  // user holding their code still in front of the camera isn't re-logged.
  if (
    state.lastValue === value &&
    state.lastValueAt !== null &&
    now - state.lastValueAt < duplicateWindowMs
  ) {
    return { accept: false, reason: 'duplicate' };
  }

  // Global cooldown: ~3s gap between accepted scans.
  if (state.lastAcceptedAt !== null && now - state.lastAcceptedAt < cooldownMs) {
    return { accept: false, reason: 'cooldown' };
  }

  return { accept: true };
}

/** Produce the next gate state after a scan was accepted. Pure. */
export function nextGateState(value: string, now: number): GateState {
  return { lastAcceptedAt: now, lastValue: value, lastValueAt: now };
}

export interface SubscriptionInput {
  qrFound: boolean;
  qrExpired: boolean;
  hasActiveMembership: boolean;
  hasPersonalTraining: boolean;
}

export interface ClassificationOutput {
  result: ScanResultType;
  subscriptionStatus: SubscriptionStatus;
  reason: string;
}

/**
 * Map raw eligibility facts to a final scan result + subscription status.
 * Single source of truth for PASS / DENIED / INVALID decisions.
 */
export function classifyScan(input: SubscriptionInput): ClassificationOutput {
  if (!input.qrFound) {
    return {
      result: 'INVALID',
      subscriptionStatus: 'invalid',
      reason: 'QR code δεν βρέθηκε ή είναι ανενεργό',
    };
  }

  if (input.qrExpired) {
    return {
      result: 'DENIED',
      subscriptionStatus: 'expired',
      reason: 'Το QR code έχει λήξει',
    };
  }

  if (input.hasActiveMembership) {
    return {
      result: 'PASS',
      subscriptionStatus: 'active',
      reason: 'Ενεργή συνδρομή',
    };
  }

  if (input.hasPersonalTraining) {
    return {
      result: 'PASS',
      subscriptionStatus: 'personal_training',
      reason: 'Εγκεκριμένο personal training',
    };
  }

  return {
    result: 'DENIED',
    subscriptionStatus: 'none',
    reason: 'Δεν υπάρχει ενεργή συνδρομή',
  };
}

// ---------------------------------------------------------------------
// History filtering / searching / sorting / pagination
// ---------------------------------------------------------------------

export type ResultFilter = 'ALL' | ScanResultType;
export type DateFilter = 'ALL' | 'TODAY' | 'WEEK';
export type SortField = 'scan_time' | 'user_name' | 'scan_result';
export type SortDir = 'asc' | 'desc';

export interface HistoryFilters {
  result?: ResultFilter;
  date?: DateFilter;
  search?: string; // matches user_name / qr_code / subscription_status
  userId?: string | null; // specific user
}

/** Local-day check (avoids UTC drift). */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True if `d` falls within the current local week (Mon..Sun) relative to `ref`. */
export function isWithinThisWeek(d: Date, ref: Date): boolean {
  // Monday as start of week.
  const day = (ref.getDay() + 6) % 7; // 0 = Monday
  const start = new Date(ref);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

export function filterScanHistory(
  rows: ScanHistoryRow[],
  filters: HistoryFilters,
  now: Date = new Date()
): ScanHistoryRow[] {
  const search = (filters.search || '').trim().toLowerCase();

  return rows.filter((row) => {
    // Result filter
    if (filters.result && filters.result !== 'ALL' && row.scan_result !== filters.result) {
      return false;
    }

    // Specific user filter
    if (filters.userId && row.user_id !== filters.userId) {
      return false;
    }

    // Date filter
    if (filters.date && filters.date !== 'ALL') {
      const t = new Date(row.scan_time);
      if (Number.isNaN(t.getTime())) return false;
      if (filters.date === 'TODAY' && !isSameLocalDay(t, now)) return false;
      if (filters.date === 'WEEK' && !isWithinThisWeek(t, now)) return false;
    }

    // Free-text search
    if (search) {
      const haystack = [
        row.user_name || '',
        row.qr_code || '',
        row.subscription_status || '',
        row.reason || '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export function sortScanHistory(
  rows: ScanHistoryRow[],
  field: SortField = 'scan_time',
  dir: SortDir = 'desc'
): ScanHistoryRow[] {
  const sign = dir === 'asc' ? 1 : -1;
  // Copy so we never mutate the source array.
  return [...rows].sort((a, b) => {
    let cmp = 0;
    if (field === 'scan_time') {
      cmp = new Date(a.scan_time).getTime() - new Date(b.scan_time).getTime();
    } else if (field === 'user_name') {
      cmp = (a.user_name || '').localeCompare(b.user_name || '', 'el');
    } else if (field === 'scan_result') {
      cmp = a.scan_result.localeCompare(b.scan_result);
    }
    if (cmp === 0) {
      // Stable tie-breaker by id.
      cmp = a.id.localeCompare(b.id);
    }
    return cmp * sign;
  });
}

export interface Paginated<T> {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

export function paginate<T>(rows: T[], page: number, pageSize: number): Paginated<T> {
  const safeSize = Math.max(1, Math.floor(pageSize) || 1);
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const startIdx = (safePage - 1) * safeSize;
  return {
    page: safePage,
    pageSize: safeSize,
    totalItems,
    totalPages,
    items: rows.slice(startIdx, startIdx + safeSize),
  };
}

/** End-to-end helper: filter -> sort -> paginate (pure). */
export function buildHistoryView(
  rows: ScanHistoryRow[],
  filters: HistoryFilters,
  sort: { field: SortField; dir: SortDir },
  page: number,
  pageSize: number,
  now: Date = new Date()
): Paginated<ScanHistoryRow> {
  const filtered = filterScanHistory(rows, filters, now);
  const sorted = sortScanHistory(filtered, sort.field, sort.dir);
  return paginate(sorted, page, pageSize);
}

// ---------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------

export function formatScanTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatScanDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Format a membership end_date ("YYYY-MM-DD" or ISO) to el-GR dd/mm/yyyy.
 *  Timezone-safe: takes the calendar date part directly so it never shifts a day
 *  for users/servers in a negative UTC offset (no off-by-one). */
export function formatExpiryDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const s = String(dateStr).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    const [, y, mo, d] = m;
    return `${d}/${mo}/${y}`;
  }
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Build display lines for one or more active subscriptions with expiry dates. */
export function buildSubscriptionLines(subs: ActiveSubscriptionInfo[]): string[] {
  return (subs || []).map((s) =>
    s.endDate ? `${s.packageName} — Λήξη ${formatExpiryDate(s.endDate)}` : s.packageName
  );
}

export function subscriptionStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'active':
      return 'Ενεργή';
    case 'expired':
      return 'Ληγμένη';
    case 'none':
      return 'Καμία';
    case 'personal_training':
      return 'Personal Training';
    case 'invalid':
      return 'Μη έγκυρο';
    default:
      return status || '—';
  }
}
