import { supabase } from '@/config/supabase';

// Types for program options
export interface OldMembersUsage {
  id: string;
  user_id: string;
  used_at: string;
  created_by: string;
}

export interface KettlebellPoints {
  id: string;
  user_id: string;
  points: number;
  program_id?: string;
  created_at: string;
  created_by: string;
}

export interface UserKettlebellSummary {
  user_id: string;
  user_name: string;
  user_email: string;
  total_points: number;
  points_count: number;
  last_updated: string;
}

// Check if user has used "Old Members" option
export const checkOldMembersUsage = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_old_members_usage')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking old members usage:', error);
      return false;
    }

    return !!data; // Returns true if record exists
  } catch (error) {
    console.error('Exception checking old members usage:', error);
    return false;
  }
};

// Mark user as having used "Old Members" option
export const markOldMembersUsed = async (userId: string, createdBy: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_old_members_usage')
      .insert({
        user_id: userId,
        created_by: createdBy
      });

    if (error) {
      console.error('Error marking old members as used:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception marking old members as used:', error);
    return false;
  }
};

// Save Kettlebell Points for a user
export const saveKettlebellPoints = async (
  userId: string, 
  points: number, 
  programId?: string, 
  createdBy: string
): Promise<boolean> => {
  try {
    if (points <= 0) {
      return true; // Don't save zero or negative points
    }

    const { error } = await supabase
      .from('user_kettlebell_points')
      .insert({
        user_id: userId,
        points: points,
        program_id: programId,
        created_by: createdBy
      });

    if (error) {
      console.error('Error saving kettlebell points:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception saving kettlebell points:', error);
    return false;
  }
};

// Get total Kettlebell Points across all users
export const getTotalKettlebellPoints = async (): Promise<number> => {
  try {
    console.log('[getTotalKettlebellPoints] Starting to fetch total points...');
    
    const { data, error } = await supabase
      .from('user_kettlebell_points')
      .select('points');

    if (error) {
      console.error('[getTotalKettlebellPoints] Error getting total kettlebell points:', error);
      return 0;
    }

    const total = data?.reduce((total, record) => total + record.points, 0) || 0;
    console.log('[getTotalKettlebellPoints] Total points calculated:', total, 'from', data?.length || 0, 'records');
    return total;
  } catch (error) {
    console.error('[getTotalKettlebellPoints] Exception getting total kettlebell points:', error);
    return 0;
  }
};

// Get Kettlebell Points summary per user
export const getKettlebellPointsSummary = async (): Promise<UserKettlebellSummary[]> => {
  try {
    console.log('[getKettlebellPointsSummary] Starting to fetch kettlebell points...');
    
    const { data, error } = await supabase
      .from('user_kettlebell_points')
      .select(`
        user_id,
        points,
        created_at,
        user_profiles!user_kettlebell_points_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getKettlebellPointsSummary] Error getting kettlebell points summary:', error);
      return [];
    }

    console.log('[getKettlebellPointsSummary] Raw data received:', data?.length || 0, 'records');
    console.log('[getKettlebellPointsSummary] Sample data:', data?.slice(0, 2));

    if (!data || data.length === 0) {
      console.log('[getKettlebellPointsSummary] No data found, returning empty array');
      return [];
    }

    // Group by user and calculate totals
    const userMap = new Map<string, UserKettlebellSummary>();

    data.forEach(record => {
      const userId = record.user_id;
      const userProfile = record.user_profiles as any;
      
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user_id: userId,
          user_name: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : `User ${userId.slice(0, 8)}`,
          user_email: userProfile?.email || 'No email',
          total_points: 0,
          points_count: 0,
          last_updated: record.created_at
        });
      }

      const userSummary = userMap.get(userId)!;
      userSummary.total_points += record.points;
      userSummary.points_count += 1;
      
      // Keep the most recent date
      if (new Date(record.created_at) > new Date(userSummary.last_updated)) {
        userSummary.last_updated = record.created_at;
      }
    });

    const result = Array.from(userMap.values()).sort((a, b) => b.total_points - a.total_points);
    console.log('[getKettlebellPointsSummary] Processed summary:', result);

    return result;
  } catch (error) {
    console.error('[getKettlebellPointsSummary] Exception getting kettlebell points summary:', error);
    return [];
  }
};

// Get all Kettlebell Points records for a specific user
export const getUserKettlebellPoints = async (userId: string): Promise<KettlebellPoints[]> => {
  try {
    const { data, error } = await supabase
      .from('user_kettlebell_points')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user kettlebell points:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception getting user kettlebell points:', error);
    return [];
  }
};
