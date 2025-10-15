// Service για την επικοινωνία με το installment plan API

import { InstallmentPlanResponse, getUserInstallmentPlan, hasOverdueInstallment } from '@/api/userInstallmentPlan';
import { supabase } from '@/config/supabase';

export type InstallmentPlanData = InstallmentPlanResponse;

export interface InstallmentPlanError {
  message: string;
  status: number;
}

/**
 * Λαμβάνει το πλάνο δόσεων για τον τρέχοντα χρήστη
 * @returns Promise με τα δεδομένα του πλάνου δόσεων ή null αν δεν υπάρχει
 */
export const getInstallmentPlan = async (): Promise<InstallmentPlanData | null> => {
  try {
    console.log('[InstallmentAPI] getInstallmentPlan called');
    
    // Λαμβάνουμε τον τρέχοντα χρήστη
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[InstallmentAPI] User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('[InstallmentAPI] Authenticated user:', user.id);

    // Καλούμε το backend function
    const plan = await getUserInstallmentPlan(user.id);
    console.log('[InstallmentAPI] getUserInstallmentPlan result:', plan);
    
    return plan;
  } catch (error) {
    console.error('[InstallmentAPI] Error fetching installment plan:', error);
    if (error instanceof Error && error.message.includes('No installment plan found')) {
      return null;
    }
    throw error;
  }
};

/**
 * Ελέγχει αν ο χρήστης έχει εγκεκριμένο πλάνο δόσεων
 * @returns Promise με boolean - true αν έχει πλάνο δόσεων
 */
export const hasInstallmentPlan = async (): Promise<boolean> => {
  try {
    console.log('[InstallmentAPI] hasInstallmentPlan called');
    const plan = await getInstallmentPlan();
    console.log('[InstallmentAPI] getInstallmentPlan result:', plan);
    const hasPlan = plan !== null;
    console.log('[InstallmentAPI] hasInstallmentPlan returning:', hasPlan);
    return hasPlan;
  } catch (error) {
    console.error('[InstallmentAPI] Error checking installment plan:', error);
    return false;
  }
};

/**
 * Ελέγχει αν ο χρήστης χρωστάει δόση που έχει κλειδωθεί
 * @returns Promise με boolean - true αν χρωστάει δόση
 */
export const checkOverdueInstallment = async (): Promise<boolean> => {
  try {
    console.log('[InstallmentAPI] checkOverdueInstallment called');
    
    // Λαμβάνουμε τον τρέχοντα χρήστη
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[InstallmentAPI] User not authenticated');
      return false;
    }

    console.log('[InstallmentAPI] Authenticated user:', user.id);

    // Καλούμε το backend function
    const hasOverdue = await hasOverdueInstallment(user.id);
    console.log('[InstallmentAPI] hasOverdueInstallment result:', hasOverdue);
    
    return hasOverdue;
  } catch (error) {
    console.error('[InstallmentAPI] Error checking overdue installment:', error);
    return false;
  }
};
