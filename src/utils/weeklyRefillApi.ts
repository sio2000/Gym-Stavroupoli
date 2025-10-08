import { supabase } from '@/config/supabase';
import { toast } from 'react-hot-toast';

// Types for weekly refill system
export interface WeeklyRefillStatus {
  user_id: string;
  package_name: string;
  activation_date: string;
  next_refill_date: string;
  next_refill_week: number;
  current_deposit_amount: number;
  target_deposit_amount: number;
  is_refill_due: boolean;
  current_week_start: string;
  current_week_end: string;
}

export interface RefillResult {
  processed_count: number;
  success_count: number;
  error_count: number;
  details: any[];
}

export interface ManualRefillResult {
  success: boolean;
  message: string;
  details: any;
}

/**
 * Get the weekly refill status for the current user
 */
export const getUserWeeklyRefillStatus = async (): Promise<WeeklyRefillStatus | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .rpc('get_user_weekly_refill_status', {
        p_user_id: user.id
      });

    if (error) {
      console.error('[WeeklyRefillAPI] Error fetching refill status:', error);
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('[WeeklyRefillAPI] Error in getUserWeeklyRefillStatus:', error);
    toast.error('Σφάλμα κατά την ανάκτηση της κατάστασης ανανέωσης');
    return null;
  }
};

/**
 * Manually trigger a weekly refill for the current user
 */
export const manualTriggerWeeklyRefill = async (): Promise<ManualRefillResult | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .rpc('manual_trigger_weekly_refill', {
        p_user_id: user.id
      });

    if (error) {
      console.error('[WeeklyRefillAPI] Error triggering manual refill:', error);
      throw error;
    }

    const result = data?.[0];
    if (result?.success) {
      toast.success('Ανανέωση Pilates deposits ολοκληρώθηκε επιτυχώς!');
    } else {
      toast.error(result?.message || 'Σφάλμα κατά την ανανέωση');
    }

    return result || null;
  } catch (error) {
    console.error('[WeeklyRefillAPI] Error in manualTriggerWeeklyRefill:', error);
    toast.error('Σφάλμα κατά την ανανέωση των Pilates deposits');
    return null;
  }
};

/**
 * Process weekly refills for all eligible users (Admin/Secretary only)
 */
export const processWeeklyRefills = async (): Promise<RefillResult | null> => {
  try {
    const { data, error } = await supabase
      .rpc('process_weekly_pilates_refills');

    if (error) {
      console.error('[WeeklyRefillAPI] Error processing weekly refills:', error);
      throw error;
    }

    const result = data?.[0];
    
    if (result) {
      const message = `Επεξεργασία ολοκληρώθηκε: ${result.success_count}/${result.processed_count} επιτυχείς ανανεώσεις`;
      if (result.error_count > 0) {
        toast.warning(`${message}, ${result.error_count} σφάλματα`);
      } else {
        toast.success(message);
      }
    }

    return result || null;
  } catch (error) {
    console.error('[WeeklyRefillAPI] Error in processWeeklyRefills:', error);
    toast.error('Σφάλμα κατά την επεξεργασία των ανανεώσεων');
    return null;
  }
};

/**
 * Get feature flag status for weekly refills
 */
export const getWeeklyRefillFeatureStatus = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('name', 'weekly_pilates_refill_enabled')
      .single();

    if (error) {
      console.error('[WeeklyRefillAPI] Error fetching feature status:', error);
      return false;
    }

    return data?.is_enabled || false;
  } catch (error) {
    console.error('[WeeklyRefillAPI] Error in getWeeklyRefillFeatureStatus:', error);
    return false;
  }
};

/**
 * Toggle feature flag for weekly refills (Admin only)
 */
export const toggleWeeklyRefillFeature = async (enabled: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .update({ 
        is_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('flag_name', 'weekly_pilates_refill_enabled');

    if (error) {
      console.error('[WeeklyRefillAPI] Error toggling feature flag:', error);
      throw error;
    }

    const message = enabled ? 'Ενεργοποιήθηκε' : 'Απενεργοποιήθηκε';
    toast.success(`Weekly refill feature ${message.toLowerCase()}`);

    return true;
  } catch (error) {
    console.error('[WeeklyRefillAPI] Error in toggleWeeklyRefillFeature:', error);
    toast.error('Σφάλμα κατά την αλλαγή της κατάστασης του feature');
    return false;
  }
};

/**
 * Get refill history for a user (Admin/Secretary only)
 */
export const getUserRefillHistory = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('ultimate_weekly_refills')
      .select(`
        *,
        user_profiles!ultimate_weekly_refills_user_id_fkey(first_name, last_name, email)
      `)
      .eq('user_id', userId)
      .order('refill_date', { ascending: false });

    if (error) {
      console.error('[WeeklyRefillAPI] Error fetching refill history:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[WeeklyRefillAPI] Error in getUserRefillHistory:', error);
    toast.error('Σφάλμα κατά την ανάκτηση του ιστορικού ανανεώσεων');
    return [];
  }
};

/**
 * Get all refill records (Admin/Secretary only)
 */
export const getAllRefillRecords = async (limit: number = 50): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('ultimate_weekly_refills')
      .select(`
        *,
        user_profiles!ultimate_weekly_refills_user_id_fkey(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[WeeklyRefillAPI] Error fetching all refill records:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[WeeklyRefillAPI] Error in getAllRefillRecords:', error);
    toast.error('Σφάλμα κατά την ανάκτηση των εγγραφών ανανεώσεων');
    return [];
  }
};

/**
 * Get statistics for weekly refills
 */
export const getWeeklyRefillStats = async (): Promise<any> => {
  try {
    // Get total refills today
    const { data: todayRefills, error: todayError } = await supabase
      .from('ultimate_weekly_refills')
      .select('*', { count: 'exact' })
      .eq('refill_date', new Date().toISOString().split('T')[0]);

    if (todayError) {
      console.error('[WeeklyRefillAPI] Error fetching today refills:', todayError);
    }

    // Get total refills this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { data: weekRefills, error: weekError } = await supabase
      .from('ultimate_weekly_refills')
      .select('*', { count: 'exact' })
      .gte('refill_date', weekStart.toISOString().split('T')[0]);

    if (weekError) {
      console.error('[WeeklyRefillAPI] Error fetching week refills:', weekError);
    }

    // Get feature flag status
    const isEnabled = await getWeeklyRefillFeatureStatus();

    return {
      today_refills: todayRefills?.length || 0,
      week_refills: weekRefills?.length || 0,
      feature_enabled: isEnabled,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('[WeeklyRefillAPI] Error in getWeeklyRefillStats:', error);
    return {
      today_refills: 0,
      week_refills: 0,
      feature_enabled: false,
      last_updated: new Date().toISOString()
    };
  }
};
