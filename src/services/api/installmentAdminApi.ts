import { supabase } from '@/config/supabase';
import { saveCashTransaction } from '@/utils/cashRegisterApi';

// Helper: format date YYYY-MM-DD (local timezone to avoid UTC conversion issues)
const formatDateLocal = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export type InstallmentStatus = 'pending' | 'overdue' | 'paid';

export interface InstallmentListItem {
  requestId: string;
  installmentNumber: 1 | 2 | 3;
  userId: string;
  userName: string;
  userEmail?: string | null;
  userPhone?: string | null;
  packageName?: string | null;
  amount: number;
  dueDate: string;
  paid: boolean;
  paymentMethod?: 'cash' | 'pos' | null;
  status: InstallmentStatus;
}

const todayIso = () => formatDateLocal(new Date());

const computeStatus = (paid: boolean, dueDate: string): InstallmentStatus => {
  if (paid) return 'paid';
  if (!dueDate) return 'pending';
  
  // Συγκρίνουμε μόνο τις ημερομηνίες (YYYY-MM-DD) χωρίς ώρες/timezone
  const due = new Date(dueDate + 'T00:00:00');
  due.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  // Αν η due date είναι <= σήμερα, είναι overdue
  return due <= now ? 'overdue' : 'pending';
};

const mapRequestToInstallments = (req: any): InstallmentListItem[] => {
  const result: InstallmentListItem[] = [];
  const userName = `${req.user?.first_name || ''} ${req.user?.last_name || ''}`.trim() || 'Χωρίς όνομα';

  const pushInstallment = (n: 1 | 2 | 3) => {
    if (n === 3 && req.third_installment_deleted) return;
    const amount = req[`installment_${n}_amount`] || 0;
    const dueDate = req[`installment_${n}_due_date`] || todayIso();
    if (!amount || amount <= 0) return;
    const paid = req[`installment_${n}_paid`] === true;
    const paymentMethod = req[`installment_${n}_payment_method`] || null;

    result.push({
      requestId: req.id,
      installmentNumber: n,
      userId: req.user_id,
      userName,
      userEmail: req.user?.email,
      userPhone: req.user?.phone,
      packageName: req.package?.name,
      amount,
      dueDate,
      paid,
      paymentMethod,
      status: computeStatus(paid, dueDate)
    });
  };

  pushInstallment(1);
  pushInstallment(2);
  pushInstallment(3);

  return result;
};

export const fetchInstallmentsAdmin = async (): Promise<InstallmentListItem[]> => {
  try {
    const { data, error } = await supabase
      .from('membership_requests')
      .select(`
        *,
        user:user_profiles!membership_requests_user_id_fkey(
          first_name,
          last_name,
          email,
          phone
        ),
        package:membership_packages!membership_requests_package_id_fkey(
          name
        )
      `)
      .eq('has_installments', true)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const requests = data || [];
    return requests.flatMap(mapRequestToInstallments);
  } catch (err) {
    console.error('[InstallmentAdminAPI] Error fetching installments:', err);
    return [];
  }
};

interface RecordPaymentInput {
  requestId: string;
  installmentNumber: 1 | 2 | 3;
  amount: number;
  method: 'cash' | 'pos';
  note?: string;
  createdBy?: string;
}

export const recordInstallmentPayment = async (payload: RecordPaymentInput): Promise<boolean> => {
  const { requestId, installmentNumber, amount, method, note, createdBy } = payload;
  const paidField = `installment_${installmentNumber}_paid`;
  const paidAtField = `installment_${installmentNumber}_paid_at`;
  const methodField = `installment_${installmentNumber}_payment_method`;
  const amountField = `installment_${installmentNumber}_amount`;

  try {
    const { data: req, error: fetchError } = await supabase
      .from('membership_requests')
      .select(
        `
          id,
          user_id,
          has_installments,
          third_installment_deleted,
          installment_1_paid,
          installment_2_paid,
          installment_3_paid,
          installment_1_amount,
          installment_2_amount,
          installment_3_amount
        `
      )
      .eq('id', requestId)
      .single();

    if (fetchError || !req) {
      throw fetchError || new Error('Request not found');
    }

    const updateData: any = {
      [paidField]: true,
      [paidAtField]: new Date().toISOString(),
      [methodField]: method,
      [amountField]: amount
    };

    const inst1Paid = installmentNumber === 1 ? true : req.installment_1_paid;
    const inst2Paid = installmentNumber === 2 ? true : req.installment_2_paid;
    const inst3Paid = installmentNumber === 3 ? true : req.installment_3_paid || req.third_installment_deleted;

    updateData.all_installments_paid = !!(inst1Paid && inst2Paid && inst3Paid);

    const { error: updateError } = await supabase
      .from('membership_requests')
      .update(updateData)
      .eq('id', requestId);

    if (updateError) throw updateError;

    const txNotes = note || `Πληρωμή δόσης ${installmentNumber} για αίτημα ${requestId}`;
    const saved = await saveCashTransaction(req.user_id, amount, method, undefined, createdBy || '', txNotes);
    if (!saved) {
      console.warn('[InstallmentAdminAPI] Payment recorded but cash transaction failed to save');
    }

    return true;
  } catch (err) {
    console.error('[InstallmentAdminAPI] Error recording installment payment:', err);
    return false;
  }
};

