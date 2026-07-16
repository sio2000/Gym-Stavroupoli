// =====================================================================
// Live QR Scanner — Service layer (Supabase I/O)
// =====================================================================
// Bridges the Live scanner UI with the database:
//   * validateLiveScan()  -> resolves a raw QR value into a full outcome
//   * saveScanHistory()   -> persists every scan (fault tolerant, never throws)
//   * fetchScanHistory()  -> loads recent history rows for the table
//
// Validation reuses the SAME eligibility rules as the existing single-shot
// scanner (active membership OR approved personal training), but routes the
// decision through the pure classifyScan() so behaviour is testable & uniform.
// =====================================================================

import { supabase } from '@/config/supabase';
import {
  classifyScan,
  type ScanResultType,
  type ScanHistoryRow,
  type ActiveSubscriptionInfo,
} from '@/utils/liveScannerLogic';

// Local-date formatter (YYYY-MM-DD) — mirrors qrSystem.ts to avoid UTC drift.
function formatDateLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export interface LiveScanUser {
  userId: string | null;
  name: string;
  email: string | null;
  photo: string | null;
  membershipName: string | null;
  /** All currently-active subscriptions (with expiry dates). May be empty. */
  subscriptions: ActiveSubscriptionInfo[];
}

export interface LiveScanOutcome {
  result: ScanResultType;
  subscriptionStatus: string;
  reason: string;
  category: string | null;
  qrCode: string;
  qrCodeId: string | null; // qr_codes.id (null for INVALID) — avoids an extra lookup
  scanTime: string; // ISO
  user: LiveScanUser | null;
}

/**
 * Resolve a raw scanned QR value into a complete outcome (PASS/DENIED/INVALID)
 * together with the user profile & subscription status. Pure decision making is
 * delegated to classifyScan(); this function only gathers the facts from the DB.
 */
export async function validateLiveScan(qrData: string): Promise<LiveScanOutcome> {
  const scanTime = new Date().toISOString();
  const trimmed = (qrData || '').trim();

  // 1) Locate active QR code by its opaque token.
  // NOTE: .limit(1) instead of .maybeSingle() — maybeSingle() returns HTTP 406
  // when more than one row matches, which turned every scan of such a user into
  // INVALID. With limit(1) duplicates can never break validation.
  const { data: qrCodeRows, error: qrError } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('qr_token', trimmed)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);
  const qrCode = qrCodeRows?.[0] ?? null;

  if (qrError) {
    console.error('[qrScanHistory] qr_codes lookup failed:', qrError);
  }
  if (qrError || !qrCode) {
    const c = classifyScan({
      qrFound: false,
      qrExpired: false,
      hasActiveMembership: false,
      hasPersonalTraining: false,
    });
    return {
      result: c.result,
      subscriptionStatus: c.subscriptionStatus,
      reason: c.reason,
      category: null,
      qrCode: trimmed,
      qrCodeId: null,
      scanTime,
      user: null,
    };
  }

  // 2) Load the user profile (best-effort; failure shouldn't break the scan).
  // Same hardening: limit(1) so a duplicate profile row can't 406 the request.
  const { data: userProfileRows } = await supabase
    .from('user_profiles')
    .select('id, user_id, email, first_name, last_name, profile_photo, avatar_url')
    .eq('user_id', qrCode.user_id)
    .limit(1);
  const userProfile = userProfileRows?.[0] ?? null;

  const name =
    `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Άγνωστος';
  const photo = userProfile?.profile_photo || userProfile?.avatar_url || null;

  // 3) Expiry check.
  const qrExpired = !!(qrCode.expires_at && new Date(qrCode.expires_at) < new Date());

  // 4) Active membership check (end_date >= today, is_active) + package name.
  const currentDate = formatDateLocal(new Date());
  const { data: activeMemberships } = await supabase
    .from('memberships')
    .select(
      `
      id,
      is_active,
      end_date,
      package:membership_packages(id, name, package_type)
    `
    )
    .eq('user_id', qrCode.user_id)
    .eq('is_active', true)
    .gte('end_date', currentDate);

  const hasActiveMembership = !!(activeMemberships && activeMemberships.length > 0);

  // 5) Approved personal training schedule check.
  let hasPersonalTraining = false;
  if (!hasActiveMembership) {
    const { data: personalSchedule } = await supabase
      .from('personal_training_schedules')
      .select('id, status')
      .eq('user_id', qrCode.user_id)
      .eq('status', 'accepted')
      .limit(1);
    hasPersonalTraining = !!(personalSchedule && personalSchedule.length > 0);
  }

  // 6) Resolve display name + collect ALL active subscriptions with their expiry
  //    dates (supports users with more than one active subscription).
  const subscriptions: ActiveSubscriptionInfo[] = (activeMemberships || []).map((m) => {
    const row = m as { end_date?: string; package?: { name?: string } | { name?: string }[] };
    const pkg = Array.isArray(row.package) ? row.package[0] : row.package;
    return {
      packageName: pkg?.name || 'Συνδρομή',
      endDate: row.end_date || null,
    };
  });
  if (hasPersonalTraining) {
    subscriptions.push({ packageName: 'Personal Training', endDate: null });
  }
  const membershipName = subscriptions.length > 0 ? subscriptions[0].packageName : null;

  // 7) Final classification (pure).
  const c = classifyScan({
    qrFound: true,
    qrExpired,
    hasActiveMembership,
    hasPersonalTraining,
  });

  return {
    result: c.result,
    subscriptionStatus: c.subscriptionStatus,
    reason: c.reason,
    category: qrCode.category || null,
    qrCode: trimmed,
    qrCodeId: qrCode.id,
    scanTime,
    user: {
      userId: userProfile?.user_id || qrCode.user_id || null,
      name,
      email: userProfile?.email || null,
      photo,
      membershipName,
      subscriptions,
    },
  };
}

export interface SaveScanHistoryParams {
  outcome: LiveScanOutcome;
  scannedBy?: string | null;
}

/**
 * Persist a scan to qr_scan_history. Fault tolerant: logs and returns false on
 * failure but NEVER throws — a logging failure must not break continuous scanning.
 */
export async function saveScanHistory(params: SaveScanHistoryParams): Promise<boolean> {
  const { outcome, scannedBy } = params;
  try {
    const { error } = await supabase.from('qr_scan_history').insert({
      user_id: outcome.user?.userId ?? null,
      qr_code: outcome.qrCode,
      user_name: outcome.user?.name ?? null,
      scan_result: outcome.result,
      subscription_status: outcome.subscriptionStatus,
      category: outcome.category,
      reason: outcome.reason,
      scanned_by: scannedBy ?? null,
      scan_time: outcome.scanTime,
    });
    if (error) {
      console.error('[qrScanHistory] Failed to save scan:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[qrScanHistory] Exception saving scan:', e);
    return false;
  }
}

/**
 * Also mirror successful entrances into scan_audit_logs so existing
 * gym-occupancy logic keeps working. Best-effort, never throws.
 */
export async function mirrorToAuditLog(
  outcome: LiveScanOutcome,
  qrCodeId: string | null,
  scannedBy?: string | null
): Promise<void> {
  if (outcome.result !== 'PASS' || !qrCodeId || !outcome.user?.userId) return;
  try {
    await supabase.from('scan_audit_logs').insert({
      qr_code_id: qrCodeId,
      user_id: outcome.user.userId,
      scan_type: 'entrance',
      status: 'approved',
      reason: outcome.reason,
      category: outcome.category || 'free_gym',
      ...(scannedBy ? { scanned_by: scannedBy } : {}),
    });
  } catch (e) {
    console.error('[qrScanHistory] mirrorToAuditLog failed (non-fatal):', e);
  }
}

/** Fetch the most recent history rows (client filters/sorts/paginates). */
export async function fetchScanHistory(limit = 500): Promise<ScanHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('qr_scan_history')
      .select('*')
      .order('scan_time', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[qrScanHistory] Failed to fetch history:', error);
      return [];
    }
    return (data || []) as ScanHistoryRow[];
  } catch (e) {
    console.error('[qrScanHistory] Exception fetching history:', e);
    return [];
  }
}

/** Look up the qr_codes.id for a token (needed for audit-log mirroring). */
export async function getQrCodeIdByToken(token: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('qr_token', (token || '').trim())
      .limit(1);
    return data?.[0]?.id ?? null;
  } catch {
    return null;
  }
}
