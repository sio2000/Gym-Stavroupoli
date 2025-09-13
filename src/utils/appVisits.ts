import { supabase } from '@/config/supabase';

export interface AppVisit {
  id: string;
  user_id: string;
  visit_date: string;
  session_duration_minutes?: number;
  page_visited?: string;
  user_agent?: string;
  created_at: string;
}

export interface MonthlyVisitsStats {
  currentMonth: number;
  previousMonth: number;
  totalVisits: number;
  averageSessionDuration: number;
}

/**
 * Track a user's visit to the application
 */
export const trackAppVisit = async (
  userId: string, 
  pageVisited?: string, 
  sessionDurationMinutes?: number
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('track_app_visit', {
      p_user_id: userId,
      p_page_visited: pageVisited || null,
      p_session_duration_minutes: sessionDurationMinutes || null
    });

    if (error) {
      console.error('[AppVisits] Error tracking visit:', error);
      throw error;
    }

    console.log(`[AppVisits] Visit tracked for user: ${userId}, page: ${pageVisited}`);
  } catch (error) {
    console.error('[AppVisits] Failed to track visit:', error);
    throw error;
  }
};

/**
 * Get user's monthly visits count
 */
export const getUserMonthlyVisits = async (
  userId: string, 
  month: number, 
  year: number
): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_user_monthly_visits', {
      p_user_id: userId,
      p_month: month,
      p_year: year
    });

    if (error) {
      console.error('[AppVisits] Error getting monthly visits:', error);
      throw error;
    }

    return data || 0;
  } catch (error) {
    console.error('[AppVisits] Failed to get monthly visits:', error);
    return 0;
  }
};

/**
 * Get comprehensive visit statistics for a user
 */
export const getUserVisitStats = async (userId: string): Promise<MonthlyVisitsStats> => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get current month visits
    const currentMonthVisits = await getUserMonthlyVisits(userId, currentMonth, currentYear);
    
    // Get previous month visits
    const previousMonthVisits = await getUserMonthlyVisits(userId, previousMonth, previousYear);

    // Get total visits and average session duration
    const { data: visitsData, error: visitsError } = await supabase
      .from('user_app_visits')
      .select('session_duration_minutes')
      .eq('user_id', userId)
      .gte('visit_date', new Date(currentYear, currentMonth - 1, 1).toISOString())
      .lte('visit_date', new Date(currentYear, currentMonth, 0).toISOString());

    if (visitsError) {
      console.error('[AppVisits] Error getting visit details:', visitsError);
      throw visitsError;
    }

    const totalVisits = visitsData?.length || 0;
    const validDurations = visitsData
      ?.filter(v => v.session_duration_minutes && v.session_duration_minutes > 0)
      .map(v => v.session_duration_minutes!) || [];
    
    const averageSessionDuration = validDurations.length > 0 
      ? validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length
      : 0;

    return {
      currentMonth: currentMonthVisits,
      previousMonth: previousMonthVisits,
      totalVisits,
      averageSessionDuration: Math.round(averageSessionDuration)
    };
  } catch (error) {
    console.error('[AppVisits] Failed to get visit stats:', error);
    return {
      currentMonth: 0,
      previousMonth: 0,
      totalVisits: 0,
      averageSessionDuration: 0
    };
  }
};

/**
 * Get recent visits for a user
 */
export const getRecentVisits = async (userId: string, limit: number = 10): Promise<AppVisit[]> => {
  try {
    const { data, error } = await supabase
      .from('user_app_visits')
      .select('*')
      .eq('user_id', userId)
      .order('visit_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AppVisits] Error getting recent visits:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[AppVisits] Failed to get recent visits:', error);
    return [];
  }
};

/**
 * Track page visit (to be called on page load)
 */
export const trackPageVisit = async (userId: string, pageName: string): Promise<void> => {
  try {
    await trackAppVisit(userId, pageName);
  } catch (error) {
    // Silently fail for page tracking to not interrupt user experience
    console.warn('[AppVisits] Page visit tracking failed:', error);
  }
};
