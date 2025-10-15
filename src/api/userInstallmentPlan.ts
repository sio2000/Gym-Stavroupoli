import { supabase } from '@/config/supabase';

// Helper function για να ανακτήσει τις πληρωμές από το ταμείο
async function getCashPaymentsForUser(userId: string): Promise<Array<{date: string, amount: number}>> {
  try {
    console.log('[InstallmentPlan] Fetching cash payments for user:', userId);
    
    const { data: payments, error } = await supabase
      .from('user_cash_transactions')
      .select('amount, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[InstallmentPlan] Error fetching cash payments:', error);
      return [];
    }

    console.log('[InstallmentPlan] Found cash payments:', payments?.length || 0);
    
    return (payments || []).map(payment => ({
      date: payment.created_at.split('T')[0], // YYYY-MM-DD format
      amount: parseFloat(payment.amount.toString())
    }));
  } catch (error) {
    console.error('[InstallmentPlan] Exception fetching cash payments:', error);
    return [];
  }
}

// Interface για την απάντηση του API
export interface InstallmentPlanResponse {
  userId: string;
  subscriptionId: string;
  status: 'approved' | 'none';
  total_amount: number;
  total_paid: number;
  remaining: number;
  installments: {
    installment_number: number;
    due_date: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    cash_payments?: number; // Πραγματικές πληρωμές από ταμείο για αυτή τη δόση
  }[];
}

// Helper function για να μετατρέψει τα δεδομένα σε το επιθυμητό schema
async function mapPlanToResponse(request: any, cashPayments: Array<{date: string, amount: number}>): Promise<InstallmentPlanResponse> {
  const installments = [];
  
  // Helper function για να υπολογίσει την κατάσταση μιας δόσης
  const calculateInstallmentStatus = (dueDate: string, installmentAmount: number, installmentNumber: number, cashPayments: number): 'pending' | 'paid' | 'overdue' => {
    // Μετατρέπουμε την ημερομηνία λήξης σε Athens timezone
    const rawDueDate = dueDate;
    const dueDateUTC = new Date(rawDueDate + 'T00:00:00');
    const dueDateAthens = new Date(dueDateUTC.toLocaleString("en-US", {timeZone: "Europe/Athens"}));
    dueDateAthens.setHours(0, 0, 0, 0);
    
    // Τρέχουσα ημερομηνία σε Athens timezone
    const today = new Date();
    const athensTime = new Date(today.toLocaleString("en-US", {timeZone: "Europe/Athens"}));
    athensTime.setHours(0, 0, 0, 0);
    
    // Έλεγχος αν η δόση έχει πληρωθεί πλήρως
    const isFullyPaid = cashPayments >= installmentAmount;
    
    // Έλεγχος αν η ημερομηνία λήξης έχει περάσει
    const isOverdue = dueDateAthens < athensTime;
    
    if (isFullyPaid) {
      return 'paid';
    } else if (isOverdue) {
      return 'overdue';
    } else {
      return 'pending';
    }
  };

  // Helper function για να υπολογίσει τις πληρωμές για μια δόση
  const calculateCashPaymentsForInstallment = (dueDate: string, installmentAmount: number, installmentNumber: number): number => {
    if (!request.installment_1_locked && !request.installment_2_locked && !request.installment_3_locked) {
      // Αν δεν έχει κλειδωθεί καμία δόση, δεν υπολογίζουμε πληρωμές
      return 0;
    }
    
    // Βρίσκουμε πληρωμές που έγιναν μέχρι και την ημερομηνία λήξης της δόσης
    const dueDateTime = new Date(dueDate);
    const paymentsUpToDueDate = cashPayments
      .filter(payment => new Date(payment.date) <= dueDateTime)
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    // Υπολογίζουμε πόσα χρήματα έχουν "καταναλωθεί" από τις προηγούμενες δόσεις
    let consumedByPreviousInstallments = 0;
    
    // Για κάθε προηγούμενη δόση που έχει κλειδωθεί
    for (let i = 1; i < installmentNumber; i++) {
      let prevInstallmentLocked = false;
      let prevInstallmentAmount = 0;
      
      if (i === 1 && request.installment_1_locked) {
        prevInstallmentLocked = true;
        prevInstallmentAmount = request.installment_1_amount || 0;
      } else if (i === 2 && request.installment_2_locked) {
        prevInstallmentLocked = true;
        prevInstallmentAmount = request.installment_2_amount || 0;
      } else if (i === 3 && request.installment_3_locked && !request.third_installment_deleted) {
        prevInstallmentLocked = true;
        prevInstallmentAmount = request.installment_3_amount || 0;
      }
      
      if (prevInstallmentLocked) {
        consumedByPreviousInstallments += prevInstallmentAmount;
      }
    }
    
    // Το διαθέσιμο ποσό για αυτή τη δόση είναι το σύνολο πληρωμών μείον όσα έχουν καταναλωθεί
    const availableForThisInstallment = Math.max(0, paymentsUpToDueDate - consumedByPreviousInstallments);
    
    // Επιστρέφουμε το μικρότερο από το διαθέσιμο ποσό και το ποσό της δόσης
    return Math.min(availableForThisInstallment, installmentAmount);
  };

  // Πρώτη δόση
  if (request.installment_1_amount && request.installment_1_amount > 0) {
    const dueDate1 = request.installment_1_due_date || new Date().toISOString().split('T')[0];
    const cashPayments1 = calculateCashPaymentsForInstallment(dueDate1, request.installment_1_amount, 1);
    const status1 = calculateInstallmentStatus(dueDate1, request.installment_1_amount, 1, cashPayments1);
    
    installments.push({
      installment_number: 1,
      due_date: dueDate1,
      amount: request.installment_1_amount,
      status: status1,
      cash_payments: cashPayments1
    });
  }
  
  // Δεύτερη δόση
  if (request.installment_2_amount && request.installment_2_amount > 0) {
    const dueDate2 = request.installment_2_due_date || new Date().toISOString().split('T')[0];
    const cashPayments2 = calculateCashPaymentsForInstallment(dueDate2, request.installment_2_amount, 2);
    const status2 = calculateInstallmentStatus(dueDate2, request.installment_2_amount, 2, cashPayments2);
    
    installments.push({
      installment_number: 2,
      due_date: dueDate2,
      amount: request.installment_2_amount,
      status: status2,
      cash_payments: cashPayments2
    });
  }
  
  // Τρίτη δόση (μόνο αν δεν έχει διαγραφεί)
  if (request.installment_3_amount && request.installment_3_amount > 0 && !request.third_installment_deleted) {
    const dueDate3 = request.installment_3_due_date || new Date().toISOString().split('T')[0];
    const cashPayments3 = calculateCashPaymentsForInstallment(dueDate3, request.installment_3_amount, 3);
    const status3 = calculateInstallmentStatus(dueDate3, request.installment_3_amount, 3, cashPayments3);
    
    installments.push({
      installment_number: 3,
      due_date: dueDate3,
      amount: request.installment_3_amount,
      status: status3,
      cash_payments: cashPayments3
    });
  }
  
  // Υπολογισμός συνολικών ποσών
  const total_amount = installments.reduce((sum, inst) => sum + inst.amount, 0);
  
  // Υπολογίζουμε το total_paid βασιζόμενοι στις πραγματικές πληρωμές από το ταμείο
  // για όλες τις δόσεις (locked, paid, overdue)
  const total_paid = installments
    .reduce((sum, inst) => sum + (inst.cash_payments || 0), 0);
  
  const remaining = total_amount - total_paid;
  
  return {
    userId: request.user_id,
    subscriptionId: request.id,
    status: request.status === 'approved' ? 'approved' : 'none',
    total_amount,
    total_paid,
    remaining,
    installments
  };
}

// Helper function για να ελέγξει αν ο χρήστης χρωστάει δόση που έχει κλειδωθεί
export const hasOverdueInstallment = async (userId: string): Promise<boolean> => {
  try {
    console.log('[InstallmentPlan] Checking for overdue installments for user:', userId);

    // Αναζήτηση για εγκεκριμένο membership request με δόσεις
    const { data: request, error: requestError } = await supabase
      .from('membership_requests')
      .select(`
        *,
        package:membership_packages(
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'approved')
      .eq('has_installments', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (requestError || !request) {
      console.log('[InstallmentPlan] No installment plan found for user:', userId);
      return false;
    }

    // Ανακτούμε τις πληρωμές από το ταμείο
    const cashPayments = await getCashPaymentsForUser(userId);
    
    // Έλεγχος κάθε δόσης που έχει κλειδωθεί
    // Χρησιμοποιούμε την τοπική ώρα της Ελλάδας (UTC+2/UTC+3)
    const today = new Date();
    const athensTime = new Date(today.toLocaleString("en-US", {timeZone: "Europe/Athens"}));
    athensTime.setHours(0, 0, 0, 0);
    
    // Έλεγχος πρώτης δόσης
    if (request.installment_1_locked && request.installment_1_amount > 0) {
      // Μετατρέπουμε την ημερομηνία λήξης για να ταιριάζει με το UI
      // Η ημερομηνία στη βάση είναι UTC, αλλά στο UI εμφανίζεται ως Athens timezone + 1 μέρα
      const rawDueDate = request.installment_1_due_date || new Date().toISOString().split('T')[0];
      const dueDate1 = new Date(rawDueDate + 'T00:00:00'); // UTC midnight
      const dueDate1Athens = new Date(dueDate1.toLocaleString("en-US", {timeZone: "Europe/Athens"}));
      dueDate1Athens.setHours(0, 0, 0, 0);
      
      // Συγκρίνουμε την due date (που εμφανίζεται στο UI) με την current date
      // Αν η current date είναι μετά την due date, τότε είναι overdue
      if (dueDate1Athens < athensTime) {
        const paymentsUpToDueDate = cashPayments
          .filter(payment => new Date(payment.date) <= dueDate1)
          .reduce((sum, payment) => sum + payment.amount, 0);
        
        // Αν δεν έχει πληρώσει όλο το ποσό μέχρι την ημερομηνία λήξης
        if (paymentsUpToDueDate < request.installment_1_amount) {
          console.log('[InstallmentPlan] Found overdue installment 1');
          return true;
        }
      }
    }

    // Έλεγχος δεύτερης δόσης
    if (request.installment_2_locked && request.installment_2_amount > 0) {
      // Μετατρέπουμε την ημερομηνία λήξης για να ταιριάζει με το UI
      const rawDueDate2 = request.installment_2_due_date || new Date().toISOString().split('T')[0];
      const dueDate2 = new Date(rawDueDate2 + 'T00:00:00'); // UTC midnight
      const dueDate2Athens = new Date(dueDate2.toLocaleString("en-US", {timeZone: "Europe/Athens"}));
      dueDate2Athens.setHours(0, 0, 0, 0);
      
      // Συγκρίνουμε την due date (που εμφανίζεται στο UI) με την current date
      if (dueDate2Athens < athensTime) {
        const paymentsUpToDueDate = cashPayments
          .filter(payment => new Date(payment.date) <= dueDate2)
          .reduce((sum, payment) => sum + payment.amount, 0);
        
        // Υπολογίζουμε πόσα χρήματα έχουν καταναλωθεί από την πρώτη δόση
        const consumedByFirstInstallment = request.installment_1_locked && request.installment_1_amount ? request.installment_1_amount : 0;
        const availableForSecondInstallment = Math.max(0, paymentsUpToDueDate - consumedByFirstInstallment);
        
        if (availableForSecondInstallment < request.installment_2_amount) {
          console.log('[InstallmentPlan] Found overdue installment 2');
          return true;
        }
      }
    }

    // Έλεγχος τρίτης δόσης
    if (request.installment_3_locked && request.installment_3_amount > 0 && !request.third_installment_deleted) {
      // Μετατρέπουμε την ημερομηνία λήξης για να ταιριάζει με το UI
      const rawDueDate3 = request.installment_3_due_date || new Date().toISOString().split('T')[0];
      const dueDate3 = new Date(rawDueDate3 + 'T00:00:00'); // UTC midnight
      const dueDate3Athens = new Date(dueDate3.toLocaleString("en-US", {timeZone: "Europe/Athens"}));
      dueDate3Athens.setHours(0, 0, 0, 0);
      
      // Συγκρίνουμε την due date (που εμφανίζεται στο UI) με την current date
      if (dueDate3Athens < athensTime) {
        const paymentsUpToDueDate = cashPayments
          .filter(payment => new Date(payment.date) <= dueDate3)
          .reduce((sum, payment) => sum + payment.amount, 0);
        
        // Υπολογίζουμε πόσα χρήματα έχουν καταναλωθεί από τις προηγούμενες δόσεις
        const consumedByPreviousInstallments = 
          (request.installment_1_locked && request.installment_1_amount ? request.installment_1_amount : 0) +
          (request.installment_2_locked && request.installment_2_amount ? request.installment_2_amount : 0);
        
        const availableForThirdInstallment = Math.max(0, paymentsUpToDueDate - consumedByPreviousInstallments);
        
        if (availableForThirdInstallment < request.installment_3_amount) {
          console.log('[InstallmentPlan] Found overdue installment 3');
          return true;
        }
      }
    }

    console.log('[InstallmentPlan] No overdue installments found');
    return false;

  } catch (error) {
    console.error('Error checking overdue installments:', error);
    return false;
  }
};

// Main function για να λαμβάνει το πλάνο δόσεων ενός χρήστη
export const getUserInstallmentPlan = async (userId: string): Promise<InstallmentPlanResponse | null> => {
  try {
    console.log('[InstallmentPlan] Fetching installment plan for user:', userId);

    // Αναζήτηση για εγκεκριμένο membership request με δόσεις
    const { data: request, error: requestError } = await supabase
      .from('membership_requests')
      .select(`
        *,
        package:membership_packages(
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'approved')
      .eq('has_installments', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (requestError) {
      if (requestError.code === 'PGRST116') {
        // Δεν βρέθηκε request
        console.log('[InstallmentPlan] No installment plan found for user:', userId);
        return null;
      }
      console.error('Error fetching installment plan:', requestError);
      throw new Error('Failed to fetch installment plan');
    }

    if (!request) {
      console.log('[InstallmentPlan] No request found for user:', userId);
      return null;
    }

    console.log('[InstallmentPlan] Found request:', request.id, 'with installments');

    // Έλεγχος αν υπάρχει τουλάχιστον μια κλειδωμένη δόση
    const hasLockedInstallments = request.installment_1_locked || 
                                 request.installment_2_locked || 
                                 request.installment_3_locked;

    if (!hasLockedInstallments) {
      console.log('[InstallmentPlan] No locked installments found for request:', request.id);
      return null;
    }

    console.log('[InstallmentPlan] Found locked installments for request:', request.id);

    // Ανακτούμε τις πληρωμές από το ταμείο
    const cashPayments = await getCashPaymentsForUser(userId);
    console.log('[InstallmentPlan] Cash payments found:', cashPayments.length);

    // Μετατροπή σε επιθυμητό format
    const response = await mapPlanToResponse(request, cashPayments);
    
    console.log('[InstallmentPlan] Returning installment plan:', response);
    return response;

  } catch (error) {
    console.error('Error in installment plan API:', error);
    throw error;
  }
};
