import { supabase } from '@/config/supabase';

// Interface για την απάντηση του API - Ένα πλάνο δόσεων
export interface InstallmentPlanResponse {
  userId: string;
  subscriptionId: string;
  packageName: string; // Όνομα πακέτου (π.χ. "Pilates", "Free Gym")
  status: 'approved' | 'none';
  total_amount: number;
  total_paid: number;
  remaining: number;
  installments: {
    installment_number: number;
    due_date: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
  }[];
}

// Interface για πολλαπλά πλάνα δόσεων
export interface MultipleInstallmentPlansResponse {
  plans: InstallmentPlanResponse[];
}

// Helper function για τον υπολογισμό της κατάστασης δόσης
// ΣΗΜΑΝΤΙΚΟ: Χρησιμοποιεί τα installment_X_paid flags για συγχρονισμό με το Admin Panel
const computeStatus = (paid: boolean, dueDate: string): 'pending' | 'paid' | 'overdue' => {
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

// Helper function για να μετατρέψει τα δεδομένα σε το επιθυμητό schema
// ΔΙΟΡΘΩΣΗ: Χρησιμοποιεί τα installment_X_paid flags (όπως το Admin Panel)
// αντί για τις πληρωμές ταμείου για τον καθορισμό της κατάστασης
function mapPlanToResponse(request: any): InstallmentPlanResponse {
  const installments = [];
  
  // Πρώτη δόση
  if (request.installment_1_amount && request.installment_1_amount > 0) {
    const dueDate1 = request.installment_1_due_date || new Date().toISOString().split('T')[0];
    const paid1 = request.installment_1_paid === true;
    
    installments.push({
      installment_number: 1,
      due_date: dueDate1,
      amount: request.installment_1_amount,
      status: computeStatus(paid1, dueDate1)
    });
  }
  
  // Δεύτερη δόση
  if (request.installment_2_amount && request.installment_2_amount > 0) {
    const dueDate2 = request.installment_2_due_date || new Date().toISOString().split('T')[0];
    const paid2 = request.installment_2_paid === true;
    
    installments.push({
      installment_number: 2,
      due_date: dueDate2,
      amount: request.installment_2_amount,
      status: computeStatus(paid2, dueDate2)
    });
  }
  
  // Τρίτη δόση (μόνο αν δεν έχει διαγραφεί)
  if (request.installment_3_amount && request.installment_3_amount > 0 && !request.third_installment_deleted) {
    const dueDate3 = request.installment_3_due_date || new Date().toISOString().split('T')[0];
    const paid3 = request.installment_3_paid === true;
    
    installments.push({
      installment_number: 3,
      due_date: dueDate3,
      amount: request.installment_3_amount,
      status: computeStatus(paid3, dueDate3)
    });
  }
  
  // Υπολογισμός συνολικών ποσών
  const total_amount = installments.reduce((sum, inst) => sum + inst.amount, 0);
  
  // Υπολογίζουμε το total_paid βασιζόμενοι στις πληρωμένες δόσεις
  const total_paid = installments
    .filter(inst => inst.status === 'paid')
    .reduce((sum, inst) => sum + inst.amount, 0);
  
  const remaining = total_amount - total_paid;
  
  // Λαμβάνουμε το όνομα του πακέτου
  const packageName = request.package?.name || 'Συνδρομή';
  
  return {
    userId: request.user_id,
    subscriptionId: request.id,
    packageName,
    status: request.status === 'approved' ? 'approved' : 'none',
    total_amount,
    total_paid,
    remaining,
    installments
  };
}

// Helper function για να ελέγξει αν ο χρήστης χρωστάει δόση που έχει κλειδωθεί
// ΔΙΟΡΘΩΣΗ: Χρησιμοποιεί τα installment_X_paid flags (όπως το Admin Panel)
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

    // Τρέχουσα ημερομηνία
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Έλεγχος πρώτης δόσης - χρησιμοποιούμε το installment_1_paid flag
    if (request.installment_1_amount > 0 && request.installment_1_paid !== true) {
      const dueDate1 = request.installment_1_due_date || new Date().toISOString().split('T')[0];
      const due1 = new Date(dueDate1 + 'T00:00:00');
      due1.setHours(0, 0, 0, 0);
      if (due1 <= now) {
        console.log('[InstallmentPlan] Found overdue installment 1');
        return true;
      }
    }

    // Έλεγχος δεύτερης δόσης - χρησιμοποιούμε το installment_2_paid flag
    if (request.installment_2_amount > 0 && request.installment_2_paid !== true) {
      const dueDate2 = request.installment_2_due_date || new Date().toISOString().split('T')[0];
      const due2 = new Date(dueDate2 + 'T00:00:00');
      due2.setHours(0, 0, 0, 0);
      if (due2 <= now) {
        console.log('[InstallmentPlan] Found overdue installment 2');
        return true;
      }
    }

    // Έλεγχος τρίτης δόσης - χρησιμοποιούμε το installment_3_paid flag
    if (request.installment_3_amount > 0 && !request.third_installment_deleted && request.installment_3_paid !== true) {
      const dueDate3 = request.installment_3_due_date || new Date().toISOString().split('T')[0];
      const due3 = new Date(dueDate3 + 'T00:00:00');
      due3.setHours(0, 0, 0, 0);
      if (due3 <= now) {
        console.log('[InstallmentPlan] Found overdue installment 3');
        return true;
      }
    }

    console.log('[InstallmentPlan] No overdue installments found');
    return false;

  } catch (error) {
    console.error('Error checking overdue installments:', error);
    return false;
  }
};

// Main function για να λαμβάνει ΟΛΑ τα πλάνα δόσεων ενός χρήστη (Pilates + Free Gym)
// ΔΙΟΡΘΩΣΗ: Χρησιμοποιεί τα installment_X_paid flags για καθορισμό κατάστασης (συγχρονισμός με Admin Panel)
export const getUserInstallmentPlan = async (userId: string): Promise<InstallmentPlanResponse | null> => {
  // Για backwards compatibility, επιστρέφουμε το πρώτο πλάνο
  const plans = await getUserInstallmentPlans(userId);
  return plans.length > 0 ? plans[0] : null;
};

// Νέα function που επιστρέφει ΟΛΑ τα πλάνα δόσεων του χρήστη
export const getUserInstallmentPlans = async (userId: string): Promise<InstallmentPlanResponse[]> => {
  try {
    console.log('[InstallmentPlan] Fetching ALL installment plans for user:', userId);

    // Αναζήτηση για ΟΛΑ τα εγκεκριμένα membership requests με δόσεις
    const { data: requests, error: requestError } = await supabase
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
      .order('created_at', { ascending: false });

    if (requestError) {
      console.error('Error fetching installment plans:', requestError);
      throw new Error('Failed to fetch installment plans');
    }

    if (!requests || requests.length === 0) {
      console.log('[InstallmentPlan] No installment plans found for user:', userId);
      return [];
    }

    console.log('[InstallmentPlan] Found', requests.length, 'requests with installments');

    // Φιλτράρουμε μόνο τα requests που έχουν κλειδωμένες δόσεις
    const validPlans: InstallmentPlanResponse[] = [];

    for (const request of requests) {
      // Έλεγχος αν υπάρχει τουλάχιστον μια κλειδωμένη δόση
      const hasLockedInstallments = request.installment_1_locked || 
                                   request.installment_2_locked || 
                                   request.installment_3_locked;

      if (hasLockedInstallments) {
        console.log('[InstallmentPlan] Found locked installments for request:', request.id, '- Package:', request.package?.name);
        const plan = mapPlanToResponse(request);
        validPlans.push(plan);
      } else {
        console.log('[InstallmentPlan] No locked installments for request:', request.id);
      }
    }

    console.log('[InstallmentPlan] Returning', validPlans.length, 'installment plans');
    return validPlans;

  } catch (error) {
    console.error('Error in installment plans API:', error);
    throw error;
  }
};
