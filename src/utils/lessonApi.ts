import { supabaseAdmin } from '@/config/supabaseAdmin';
import { Lesson, Room, Trainer, LessonCategory } from '@/types';

export interface LessonFormData {
  name: string;
  description: string;
  category_id: string;
  trainer_id: string;
  room_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  is_active: boolean;
}

export interface LessonBooking {
  id: string;
  user_id: string;
  lesson_id: string;
  booking_date: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  created_at: string;
  updated_at: string;
  lesson?: Lesson;
}

export interface LessonAvailability {
  total_capacity: number;
  current_bookings: number;
  available_spots: number;
  is_available: boolean;
}

// Get all lessons with related data
export const getLessons = async (): Promise<Lesson[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select(`
        *,
        lesson_categories(name, color, icon),
        rooms(name, capacity),
        trainers(
          user_id,
          user_profiles(first_name, last_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }
};

// Get lesson by ID
export const getLessonById = async (id: string): Promise<Lesson | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select(`
        *,
        lesson_categories(name, color, icon),
        rooms(name, capacity),
        trainers(
          user_id,
          user_profiles(first_name, last_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    throw error;
  }
};

// Create new lesson
export const createLesson = async (lessonData: LessonFormData): Promise<Lesson> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .insert([lessonData])
      .select(`
        *,
        lesson_categories(name, color, icon),
        rooms(name, capacity),
        trainers(
          user_id,
          user_profiles(first_name, last_name)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

// Update lesson
export const updateLesson = async (id: string, lessonData: Partial<LessonFormData>): Promise<Lesson> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .update(lessonData)
      .eq('id', id)
      .select(`
        *,
        lesson_categories(name, color, icon),
        rooms(name, capacity),
        trainers(
          user_id,
          user_profiles(first_name, last_name)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

// Delete lesson
export const deleteLesson = async (id: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
};

// Get all lesson categories
export const getLessonCategories = async (): Promise<LessonCategory[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lesson_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching lesson categories:', error);
    throw error;
  }
};

// Get all rooms
export const getRooms = async (): Promise<Room[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

// Get all trainers
export const getTrainers = async (): Promise<Trainer[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('trainers')
      .select(`
        *,
        user_profiles(first_name, last_name)
      `)
      .eq('is_active', true)
      .order('created_at');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching trainers:', error);
    throw error;
  }
};

// Get lesson availability for a specific date
export const getLessonAvailability = async (lessonId: string, date: string): Promise<LessonAvailability> => {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_lesson_availability', {
        p_lesson_id: lessonId,
        p_date: date
      });

    if (error) throw error;
    return data[0] || { total_capacity: 0, current_bookings: 0, available_spots: 0, is_available: false };
  } catch (error) {
    console.error('Error fetching lesson availability:', error);
    throw error;
  }
};

// Book a lesson
export const bookLesson = async (userId: string, lessonId: string, bookingDate: string): Promise<{ success: boolean; message: string; booking_id?: string }> => {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('book_lesson', {
        p_user_id: userId,
        p_lesson_id: lessonId,
        p_booking_date: bookingDate
      });

    if (error) throw error;
    return data[0] || { success: false, message: 'Unknown error' };
  } catch (error) {
    console.error('Error booking lesson:', error);
    throw error;
  }
};

// Cancel a lesson booking
export const cancelLessonBooking = async (bookingId: string, userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('cancel_lesson_booking', {
        p_booking_id: bookingId,
        p_user_id: userId
      });

    if (error) throw error;
    return data[0] || { success: false, message: 'Unknown error' };
  } catch (error) {
    console.error('Error cancelling lesson booking:', error);
    throw error;
  }
};

// Get user's lesson bookings
export const getUserLessonBookings = async (userId: string, startDate?: string, endDate?: string): Promise<LessonBooking[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_user_lesson_bookings', {
        p_user_id: userId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user lesson bookings:', error);
    throw error;
  }
};

// Get available lessons for a specific date
export const getAvailableLessons = async (date: string): Promise<any[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_available_lessons', {
        p_date: date
      });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching available lessons:', error);
    throw error;
  }
};

// Get lessons by category
export const getLessonsByCategory = async (categoryId: string): Promise<Lesson[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select(`
        *,
        lesson_categories(name, color, icon),
        rooms(name, capacity),
        trainers(
          user_id,
          user_profiles(first_name, last_name)
        )
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('start_time');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching lessons by category:', error);
    throw error;
  }
};

// Get lessons by trainer
export const getLessonsByTrainer = async (trainerId: string): Promise<Lesson[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select(`
        *,
        lesson_categories(name, color, icon),
        rooms(name, capacity),
        trainers(
          user_id,
          user_profiles(first_name, last_name)
        )
      `)
      .eq('trainer_id', trainerId)
      .eq('is_active', true)
      .order('day_of_week, start_time');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching lessons by trainer:', error);
    throw error;
  }
};

// Search lessons
export const searchLessons = async (searchTerm: string, filters?: {
  categoryId?: string;
  difficulty?: string;
  dayOfWeek?: number;
  isActive?: boolean;
}): Promise<Lesson[]> => {
  try {
    let query = supabaseAdmin
      .from('lessons')
      .select(`
        *,
        lesson_categories(name, color, icon),
        rooms(name, capacity),
        trainers(
          user_id,
          user_profiles(first_name, last_name)
        )
      `);

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters?.dayOfWeek !== undefined) {
      query = query.eq('day_of_week', filters.dayOfWeek);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching lessons:', error);
    throw error;
  }
};

// Get lesson statistics
export const getLessonStatistics = async (): Promise<{
  totalLessons: number;
  activeLessons: number;
  totalBookings: number;
  totalCategories: number;
  totalRooms: number;
  totalTrainers: number;
}> => {
  try {
    const [
      { count: totalLessons },
      { count: activeLessons },
      { count: totalBookings },
      { count: totalCategories },
      { count: totalRooms },
      { count: totalTrainers }
    ] = await Promise.all([
      supabaseAdmin.from('lessons').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('lessons').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('lesson_bookings').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('lesson_categories').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('rooms').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('trainers').select('*', { count: 'exact', head: true })
    ]);

    return {
      totalLessons: totalLessons || 0,
      activeLessons: activeLessons || 0,
      totalBookings: totalBookings || 0,
      totalCategories: totalCategories || 0,
      totalRooms: totalRooms || 0,
      totalTrainers: totalTrainers || 0
    };
  } catch (error) {
    console.error('Error fetching lesson statistics:', error);
    throw error;
  }
};
