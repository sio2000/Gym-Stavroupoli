// ============================================================================
// QR ELIGIBILITY (κεντρικός έλεγχος για generation + scanning)
// ============================================================================
// Κανόνες:
//  • Χρήστης με "unrestricted" συνδρομή (Free Gym / Ultimate / standard):
//    QR διαθέσιμο συνεχώς (υφιστάμενη συμπεριφορά).
//  • Χρήστης με ΜΟΝΟ Personal (Personal Ατομικό / Ομαδικό WOD) ή/και ΜΟΝΟ Pilates:
//    QR ενεργό ΜΟΝΟ από 30' πριν την έναρξη έως τη λήξη ΠΡΑΓΜΑΤΙΚΗΣ κράτησης.
//  • Το legacy "accepted personal_training_schedules" ΔΕΝ δίνει πλέον QR
//    (πλήρης αντικατάσταση παλιού Personal συστήματος).
// ============================================================================

import { supabase } from '@/config/supabase';
import {
  getPersonalQRWindowStatus,
  getPilatesQRWindowStatus,
  QRWindowStatus,
} from './personalSystemApi';

const formatDateLocal = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export interface QrMembershipInfo {
  packageName: string;
  endDate: string | null;
}

export interface QrEligibilityResult {
  /** Μπορεί να έχει/χρησιμοποιήσει QR ΤΩΡΑ */
  eligible: boolean;
  /** true = μόνο personal/pilates συνδρομές (QR μόνο σε παράθυρο μαθήματος) */
  restricted: boolean;
  /** Έχει οποιαδήποτε ενεργή συνδρομή */
  hasAnyActiveMembership: boolean;
  memberships: QrMembershipInfo[];
  window: QRWindowStatus | null;
  reasonCode:
    | 'unrestricted_membership'
    | 'lesson_window_active'
    | 'outside_lesson_window'
    | 'no_membership';
  message: string;
}

const isPersonalPackage = (name: string, type: string): boolean =>
  type === 'personal' || name.includes('personal');

const isPilatesPackage = (name: string, type: string): boolean =>
  (type === 'pilates' || name === 'pilates') && !name.includes('ultimate');

export const evaluateQrEligibility = async (userId: string): Promise<QrEligibilityResult> => {
  const base: QrEligibilityResult = {
    eligible: false,
    restricted: false,
    hasAnyActiveMembership: false,
    memberships: [],
    window: null,
    reasonCode: 'no_membership',
    message: 'Δεν βρέθηκε ενεργή συνδρομή για είσοδο στο γυμναστήριο.',
  };

  try {
    const today = formatDateLocal(new Date());
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        id,
        end_date,
        status,
        deleted_at,
        membership_packages(name, package_type)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .gte('end_date', today);

    if (error) {
      console.error('[QrEligibility] memberships error:', error);
      return base;
    }

    let hasUnrestricted = false;
    let hasPersonal = false;
    let hasPilates = false;

    for (const m of data || []) {
      const pkgRaw = (m as any).membership_packages;
      const pkg = Array.isArray(pkgRaw) ? pkgRaw[0] : pkgRaw;
      const name = (pkg?.name || '').toLowerCase();
      const type = (pkg?.package_type || '').toLowerCase();

      base.memberships.push({ packageName: pkg?.name || 'Συνδρομή', endDate: m.end_date || null });

      if (isPersonalPackage(name, type)) {
        hasPersonal = true;
      } else if (isPilatesPackage(name, type)) {
        hasPilates = true;
      } else {
        // Free Gym / Ultimate / standard κλπ
        hasUnrestricted = true;
      }
    }

    base.hasAnyActiveMembership = base.memberships.length > 0;

    if (hasUnrestricted) {
      base.eligible = true;
      base.restricted = false;
      base.reasonCode = 'unrestricted_membership';
      base.message = 'Ενεργή συνδρομή';
      return base;
    }

    if (!hasPersonal && !hasPilates) {
      // Καμία συνδρομή. Το legacy personal_training_schedules ΔΕΝ δίνει πλέον QR.
      return base;
    }

    // Restricted: personal/pilates-only → απαιτείται πραγματική κράτηση σε παράθυρο
    base.restricted = true;

    if (hasPersonal) {
      const w = await getPersonalQRWindowStatus(userId);
      if (w.hasBookingWindow) {
        base.eligible = true;
        base.window = w;
        base.reasonCode = 'lesson_window_active';
        base.message = 'Ενεργό μάθημα Personal — καλή προπόνηση!';
        return base;
      }
    }
    if (hasPilates) {
      const w = await getPilatesQRWindowStatus(userId);
      if (w.hasBookingWindow) {
        base.eligible = true;
        base.window = w;
        base.reasonCode = 'lesson_window_active';
        base.message = 'Ενεργό μάθημα Pilates — καλή προπόνηση!';
        return base;
      }
    }

    base.eligible = false;
    base.reasonCode = 'outside_lesson_window';
    base.message =
      'Το QR ενεργοποιείται 30 λεπτά πριν την έναρξη του δηλωμένου μαθήματός σας και παραμένει ενεργό μέχρι τη λήξη του.';
    return base;
  } catch (e) {
    console.error('[QrEligibility] exception:', e);
    return base;
  }
};
