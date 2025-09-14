import { supabase } from '@/config/supabase';

export const uploadProfilePhoto = async (file: File, userId: string): Promise<string> => {
  try {
    console.log('[ProfileUtils] ===== UPLOAD PROFILE PHOTO STARTED =====');
    console.log('[ProfileUtils] File:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('[ProfileUtils] User ID:', userId);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Παρακαλώ επιλέξτε ένα αρχείο εικόνας');
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 5MB');
    }
    
    // Validate user ID
    if (!userId) {
      throw new Error('Λάθος αναγνωριστικό χρήστη');
    }
    
    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/profile_photo.${fileExt}`;
    
    console.log('[ProfileUtils] Uploading to:', fileName);
    
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('[ProfileUtils] Upload error:', error);
      
      // Handle specific Supabase errors
      if (error.message.includes('Bucket not found')) {
        throw new Error('Σφάλμα αποθήκευσης: Το bucket δεν βρέθηκε');
      } else if (error.message.includes('Invalid JWT')) {
        throw new Error('Σφάλμα αυθεντικοποίησης. Παρακαλώ συνδεθείτε ξανά');
      } else if (error.message.includes('File size')) {
        throw new Error('Το αρχείο είναι πολύ μεγάλο');
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error('Υπέρβαση ορίου αποθήκευσης');
      } else {
        throw new Error(`Σφάλμα αποθήκευσης: ${error.message}`);
      }
    }

    console.log('[ProfileUtils] Upload successful, data:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    console.log('[ProfileUtils] Public URL:', publicUrl);
    console.log('[ProfileUtils] ===== UPLOAD PROFILE PHOTO COMPLETED =====');
    return publicUrl;
  } catch (error) {
    console.error('[ProfileUtils] ===== UPLOAD PROFILE PHOTO FAILED =====');
    console.error('Error uploading profile photo:', error);
    
    // Re-throw with more user-friendly message if it's our custom error
    if (error instanceof Error && error.message.startsWith('Παρακαλώ') || error.message.startsWith('Το αρχείο') || error.message.startsWith('Σφάλμα')) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
      throw new Error('Σφάλμα δικτύου. Ελέγξτε τη σύνδεσή σας');
    }
    
    // Generic fallback
    throw new Error('Σφάλμα κατά την αποθήκευση της φωτογραφίας');
  }
};

export const deleteProfilePhoto = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([`${userId}/profile_photo.jpg`, `${userId}/profile_photo.png`, `${userId}/profile_photo.jpeg`]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    throw error;
  }
};

export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('el-GR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ===== User Metrics & Goals API (Supabase) =====
export interface UserMetricInput {
  weight_kg?: number;
  height_cm?: number;
  body_fat_pct?: number;
  water_liters?: number;
  age_years?: number;
  gender?: 'male' | 'female' | 'other';
  sleep_hours?: number;
  sleep_quality?: string;
  steps_per_day?: number;
  workout_type?: string;
  metric_date?: string; // YYYY-MM-DD
  notes?: string;
}

export async function addUserMetric(userId: string, input: UserMetricInput) {
  console.log('[ProfileUtils] ===== SMART METRIC UPDATE =====');
  console.log('[ProfileUtils] User ID:', userId);
  console.log('[ProfileUtils] Input data:', input);
  
  const metricDate = input.metric_date || new Date().toISOString().split('T')[0];
  
  // First, get the latest metric for this date to preserve existing data
  console.log('[ProfileUtils] Getting latest metric for date:', metricDate);
  
  const { data: existingMetrics, error: fetchError } = await supabase
    .from('user_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('metric_date', metricDate)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (fetchError) {
    console.error('[ProfileUtils] Error fetching existing metrics:', fetchError);
    throw fetchError;
  }
  
  const existingMetric = existingMetrics?.[0];
  console.log('[ProfileUtils] Existing metric found:', existingMetric);
  
  // Start with existing data or empty object
  const baseData = existingMetric || {
    user_id: userId,
    metric_date: metricDate,
    weight_kg: null,
    height_cm: null,
    body_fat_pct: null,
    water_liters: null,
    age_years: null,
    gender: null,
    sleep_hours: null,
    sleep_quality: null,
    steps_per_day: null,
    workout_type: null,
    notes: null
  };
  
  // Only update fields that have new values
  const payload = { ...baseData };
  
  if (input.weight_kg !== undefined && input.weight_kg !== null && input.weight_kg !== '') {
    payload.weight_kg = input.weight_kg;
    console.log('[ProfileUtils] Updating weight:', input.weight_kg);
  }
  if (input.height_cm !== undefined && input.height_cm !== null && input.height_cm !== '') {
    payload.height_cm = input.height_cm;
    console.log('[ProfileUtils] Updating height:', input.height_cm);
  }
  if (input.body_fat_pct !== undefined && input.body_fat_pct !== null && input.body_fat_pct !== '') {
    payload.body_fat_pct = input.body_fat_pct;
    console.log('[ProfileUtils] Updating body fat:', input.body_fat_pct);
  }
  if (input.water_liters !== undefined && input.water_liters !== null && input.water_liters !== '') {
    payload.water_liters = input.water_liters;
    console.log('[ProfileUtils] Updating water:', input.water_liters);
  }
  if (input.age_years !== undefined && input.age_years !== null && input.age_years !== '') {
    payload.age_years = input.age_years;
    console.log('[ProfileUtils] Updating age:', input.age_years);
  }
  if (input.gender !== undefined && input.gender !== null && input.gender !== '') {
    payload.gender = input.gender;
    console.log('[ProfileUtils] Updating gender:', input.gender);
  }
  if (input.sleep_hours !== undefined && input.sleep_hours !== null && input.sleep_hours !== '') {
    payload.sleep_hours = input.sleep_hours;
    console.log('[ProfileUtils] Updating sleep hours:', input.sleep_hours);
  }
  if (input.sleep_quality !== undefined && input.sleep_quality !== null && input.sleep_quality !== '') {
    payload.sleep_quality = input.sleep_quality;
    console.log('[ProfileUtils] Updating sleep quality:', input.sleep_quality);
  }
  if (input.steps_per_day !== undefined && input.steps_per_day !== null && input.steps_per_day !== '') {
    payload.steps_per_day = input.steps_per_day;
    console.log('[ProfileUtils] Updating steps:', input.steps_per_day);
  }
  if (input.workout_type !== undefined && input.workout_type !== null && input.workout_type !== '') {
    payload.workout_type = input.workout_type;
    console.log('[ProfileUtils] Updating workout type:', input.workout_type);
  }
  if (input.notes !== undefined && input.notes !== null && input.notes !== '') {
    payload.notes = input.notes;
    console.log('[ProfileUtils] Updating notes:', input.notes);
  }
  
  console.log('[ProfileUtils] Final payload:', payload);
  
  try {
    let result;
    
    if (existingMetric) {
      // Update existing metric
      console.log('[ProfileUtils] Updating existing metric with ID:', existingMetric.id);
      
      const { data, error } = await supabase
        .from('user_metrics')
        .update(payload)
        .eq('id', existingMetric.id)
        .select()
        .single();
        
      if (error) {
        console.error('[ProfileUtils] Error updating metric:', error);
        throw error;
      }
      
      result = data;
      console.log('[ProfileUtils] Successfully updated user metric:', data);
    } else {
      // Insert new metric
      console.log('[ProfileUtils] Inserting new metric');
      
      const { data, error } = await supabase
        .from('user_metrics')
        .insert(payload)
        .select()
        .single();
        
      if (error) {
        console.error('[ProfileUtils] Error inserting metric:', error);
        throw error;
      }
      
      result = data;
      console.log('[ProfileUtils] Successfully inserted user metric:', data);
    }
    
    console.log('[ProfileUtils] ===== METRIC UPSERTED SUCCESSFULLY =====');
    return result;
  } catch (error) {
    console.error('[ProfileUtils] Exception caught:', error);
    throw error;
  }
}

export async function getUserMetrics(userId: string, limit = 60) {
  console.log('[ProfileUtils] ===== GETTING USER METRICS =====');
  console.log('[ProfileUtils] User ID:', userId);
  console.log('[ProfileUtils] Limit:', limit);
  
  try {
    const { data, error } = await supabase
      .from('user_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('[ProfileUtils] Error fetching metrics:', error);
      throw error;
    }
    
    console.log('[ProfileUtils] Metrics fetched successfully:', data);
    console.log('[ProfileUtils] Metrics count:', data?.length || 0);
    console.log('[ProfileUtils] First 3 metrics:', data?.slice(0, 3).map(m => ({
      id: m.id,
      date: m.metric_date,
      created_at: m.created_at,
      weight: m.weight_kg,
      body_fat: m.body_fat_pct
    })));
    console.log('[ProfileUtils] ===== METRICS FETCHED =====');
    return data || [];
  } catch (error) {
    console.error('[ProfileUtils] Exception in getUserMetrics:', error);
    throw error;
  }
}

export interface UserGoalInput {
  goal_type: 'weight' | 'body_fat' | 'water' | 'steps' | 'sleep' | 'workout_days' | 'custom';
  target_value: number;
  unit: string; // 'kg' | '%' | 'L' | 'steps' | 'hours' | 'days/week'
  title?: string;
}

export async function upsertUserGoal(userId: string, goal: UserGoalInput) {
  const { data, error } = await supabase
    .from('user_goals')
    .upsert({
      user_id: userId,
      goal_type: goal.goal_type,
      target_value: goal.target_value,
      unit: goal.unit,
      title: goal.title || null
    }, { onConflict: 'user_id,goal_type' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserGoals(userId: string) {
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

export async function addAchievement(userId: string, code: string, title: string, description?: string) {
  const { data, error } = await supabase
    .from('user_achievements')
    .insert({ user_id: userId, code, title, description: description || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAchievements(userId: string) {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertChallenge(userId: string, code: string, title: string, description?: string) {
  const { data, error } = await supabase
    .from('user_challenges')
    .upsert({ user_id: userId, code, title, description: description || null }, { onConflict: 'user_id,code' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateChallengeStatus(userId: string, code: string, status: 'pending' | 'in_progress' | 'completed') {
  const { data, error } = await supabase
    .from('user_challenges')
    .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
    .eq('user_id', userId)
    .eq('code', code)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getChallenges(userId: string) {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });
  if (error) throw error;
  return data || [];
}