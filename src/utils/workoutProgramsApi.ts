import { supabase } from '@/config/supabase';

// Types
export interface WorkoutCategory {
  id: string;
  name: string;
  name_english?: string;
  icon?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  name_english?: string;
  description?: string;
  youtube_url?: string;
  category_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: WorkoutCategory;
  set_config?: ExerciseSetConfig;
}

export interface ExerciseSetConfig {
  id: string;
  exercise_id: string;
  sets: number;
  reps_min?: number;
  reps_max?: number;
  reps_text?: string;
  rest_seconds: number;
  weight_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CombinedWorkoutProgram {
  id: string;
  name: string;
  name_english?: string;
  description?: string;
  program_type: 'upper-body' | 'lower-body' | 'full-body' | 'free-weights';
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  exercises?: CombinedProgramExercise[];
}

export interface CombinedProgramExercise {
  id: string;
  combined_program_id: string;
  exercise_id: string;
  display_order: number;
  sets: number;
  reps_min?: number;
  reps_max?: number;
  reps_text?: string;
  rest_seconds: number;
  weight_notes?: string;
  notes?: string;
  weight_kg?: number; // Weight in kilograms (e.g., 20.5)
  rm_percentage?: number; // Percentage of 1RM (e.g., 60.00 for 60%)
  rpe?: number; // Rate of Perceived Exertion (e.g., 8.5)
  time_seconds?: number; // Time duration in seconds (e.g., 1800 for 30 minutes) - for cardio/time-based exercises
  created_at: string;
  updated_at: string;
  exercise?: WorkoutExercise;
}

// Categories
export const getWorkoutCategories = async (): Promise<WorkoutCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_program_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching workout categories:', error);
    throw error;
  }
};

export const createWorkoutCategory = async (category: Partial<WorkoutCategory>): Promise<WorkoutCategory> => {
  try {
    const { data, error } = await supabase
      .from('workout_program_categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating workout category:', error);
    throw error;
  }
};

export const updateWorkoutCategory = async (id: string, updates: Partial<WorkoutCategory>): Promise<WorkoutCategory> => {
  try {
    const { data, error } = await supabase
      .from('workout_program_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating workout category:', error);
    throw error;
  }
};

export const deleteWorkoutCategory = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('workout_program_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting workout category:', error);
    throw error;
  }
};

// Exercises
export const getWorkoutExercises = async (categoryId?: string): Promise<WorkoutExercise[]> => {
  try {
    let query = supabase
      .from('workout_exercises')
      .select(`
        *,
        category:workout_program_categories(*),
        set_config:exercise_set_configs(*)
      `)
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching workout exercises:', error);
    throw error;
  }
};

export const createWorkoutExercise = async (exercise: Partial<WorkoutExercise>): Promise<WorkoutExercise> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert([exercise])
      .select(`
        *,
        category:workout_program_categories(*),
        set_config:exercise_set_configs(*)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating workout exercise:', error);
    throw error;
  }
};

export const updateWorkoutExercise = async (id: string, updates: Partial<WorkoutExercise>): Promise<WorkoutExercise> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:workout_program_categories(*),
        set_config:exercise_set_configs(*)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating workout exercise:', error);
    throw error;
  }
};

export const deleteWorkoutExercise = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting workout exercise:', error);
    throw error;
  }
};

// Exercise Set Configs
export const getExerciseSetConfig = async (exerciseId: string): Promise<ExerciseSetConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('exercise_set_configs')
      .select('*')
      .eq('exercise_id', exerciseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching exercise set config:', error);
    throw error;
  }
};

export const upsertExerciseSetConfig = async (config: Partial<ExerciseSetConfig>): Promise<ExerciseSetConfig> => {
  try {
    const { data, error } = await supabase
      .from('exercise_set_configs')
      .upsert(config, { onConflict: 'exercise_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting exercise set config:', error);
    throw error;
  }
};

// Combined Programs
export const getCombinedWorkoutPrograms = async (): Promise<CombinedWorkoutProgram[]> => {
  try {
    const { data, error } = await supabase
      .from('combined_workout_programs')
      .select(`
        *,
        exercises:combined_program_exercises(
          *,
          exercise:workout_exercises(
            *,
            category:workout_program_categories(*)
          )
        )
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    
    // Sort exercises by display_order
    return (data || []).map(program => ({
      ...program,
      exercises: program.exercises?.sort((a: any, b: any) => a.display_order - b.display_order)
    }));
  } catch (error) {
    console.error('Error fetching combined workout programs:', error);
    throw error;
  }
};

export const createCombinedWorkoutProgram = async (program: Partial<CombinedWorkoutProgram>): Promise<CombinedWorkoutProgram> => {
  try {
    const { data, error } = await supabase
      .from('combined_workout_programs')
      .insert([program])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating combined workout program:', error);
    throw error;
  }
};

export const updateCombinedWorkoutProgram = async (id: string, updates: Partial<CombinedWorkoutProgram>): Promise<CombinedWorkoutProgram> => {
  try {
    const { data, error } = await supabase
      .from('combined_workout_programs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating combined workout program:', error);
    throw error;
  }
};

export const deleteCombinedWorkoutProgram = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('combined_workout_programs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting combined workout program:', error);
    throw error;
  }
};

// Combined Program Exercises
export const addExerciseToCombinedProgram = async (exercise: Partial<CombinedProgramExercise>): Promise<CombinedProgramExercise> => {
  try {
    const { data, error } = await supabase
      .from('combined_program_exercises')
      .insert([exercise])
      .select(`
        *,
        exercise:workout_exercises(
          *,
          category:workout_program_categories(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding exercise to combined program:', error);
    throw error;
  }
};

export const updateCombinedProgramExercise = async (id: string, updates: Partial<CombinedProgramExercise>): Promise<CombinedProgramExercise> => {
  try {
    // Filter out undefined values and convert them to null for database
    const cleanUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      } else {
        // Convert undefined to null for database
        cleanUpdates[key] = null;
      }
    }

    const { data, error } = await supabase
      .from('combined_program_exercises')
      .update(cleanUpdates)
      .eq('id', id)
      .select(`
        *,
        exercise:workout_exercises(
          *,
          category:workout_program_categories(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating combined program exercise:', error);
    throw error;
  }
};

export const deleteCombinedProgramExercise = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('combined_program_exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting combined program exercise:', error);
    throw error;
  }
};

export const reorderCombinedProgramExercises = async (
  programId: string,
  exerciseIds: string[]
): Promise<void> => {
  try {
    // Update display_order for each exercise
    const updates = exerciseIds.map((exerciseId, index) => ({
      id: exerciseId,
      display_order: index
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('combined_program_exercises')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
        .eq('combined_program_id', programId);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error reordering combined program exercises:', error);
    throw error;
  }
};

