import { supabase } from '@/config/supabase';

export interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  target_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BannerInput {
  title?: string;
  image_url: string;
  target_url?: string;
  display_order?: number;
  is_active?: boolean;
}

const isMissingTableError = (error: any) =>
  error?.code === 'PGRST205' || /Could not find the table/i.test(error?.message || '');

// Upload banner image to Supabase Storage
export const uploadBannerImage = async (file: File): Promise<string> => {
  try {
    console.log('[BannersApi] Uploading banner image:', file.name, 'Size:', file.size);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Παρακαλώ επιλέξτε ένα αρχείο εικόνας');
    }
    
    // Validate file size (max 10MB for banners)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 10MB');
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `banners/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    console.log('[BannersApi] Uploading to:', fileName);
    
    const { data, error } = await supabase.storage
      .from('banners')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[BannersApi] Upload error:', error);
      throw new Error(`Σφάλμα αποθήκευσης: ${error.message}`);
    }

    console.log('[BannersApi] Upload successful, data:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('banners')
      .getPublicUrl(fileName);

    console.log('[BannersApi] Public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('[BannersApi] Error uploading banner image:', error);
    throw error;
  }
};

// Delete banner image from Supabase Storage
export const deleteBannerImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `banners/${fileName}`;
    
    console.log('[BannersApi] Deleting banner image:', filePath);
    
    const { error } = await supabase.storage
      .from('banners')
      .remove([filePath]);

    if (error) {
      console.error('[BannersApi] Delete error:', error);
      throw error;
    }
    
    console.log('[BannersApi] Image deleted successfully');
  } catch (error) {
    console.error('[BannersApi] Error deleting banner image:', error);
    throw error;
  }
};

// Get all banners (admin only)
export const getAllBanners = async (): Promise<Banner[]> => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error)) {
        console.warn('[BannersApi] Table banners missing in schema. Returning empty list.');
        return [];
      }
      console.error('[BannersApi] Error fetching banners:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn('[BannersApi] Table banners missing in schema. Returning empty list.');
      return [];
    }
    console.error('[BannersApi] Error in getAllBanners:', error);
    throw error;
  }
};

// Get active banners (public)
export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(5); // Maximum 5 banners

    if (error) {
      if (isMissingTableError(error)) {
        console.warn('[BannersApi] Table banners missing in schema. Returning empty list.');
        return [];
      }
      console.error('[BannersApi] Error fetching active banners:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn('[BannersApi] Table banners missing in schema. Returning empty list.');
      return [];
    }
    console.error('[BannersApi] Error in getActiveBanners:', error);
    throw error;
  }
};

// Create a new banner
export const createBanner = async (banner: BannerInput): Promise<Banner> => {
  try {
    // Check if we already have 5 banners
    const existingBanners = await getAllBanners();
    if (existingBanners.length >= 5) {
      throw new Error('Μπορείτε να έχετε μέχρι 5 banners. Διαγράψτε ένα υπάρχον για να προσθέσετε νέο.');
    }

    const { data, error } = await supabase
      .from('banners')
      .insert({
        title: banner.title || null,
        image_url: banner.image_url,
        target_url: banner.target_url || null,
        display_order: banner.display_order || existingBanners.length,
        is_active: banner.is_active !== undefined ? banner.is_active : true
      })
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        throw new Error('Table banners missing in Supabase. Δημιούργησε τον πίνακα πριν ανεβάσεις banners.');
      }
      console.error('[BannersApi] Error creating banner:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[BannersApi] Error in createBanner:', error);
    throw error;
  }
};

// Update a banner
export const updateBanner = async (id: string, banner: Partial<BannerInput>): Promise<Banner> => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .update({
        ...banner,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        throw new Error('Table banners missing in Supabase. Δημιούργησε τον πίνακα πριν κάνεις ενημέρωση.');
      }
      console.error('[BannersApi] Error updating banner:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[BannersApi] Error in updateBanner:', error);
    throw error;
  }
};

// Delete a banner
export const deleteBanner = async (id: string): Promise<void> => {
  try {
    // First get the banner to delete the image
    const { data: banner, error: fetchError } = await supabase
      .from('banners')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (isMissingTableError(fetchError)) {
        throw new Error('Table banners missing σε Supabase. Δεν μπορεί να γίνει διαγραφή.');
      }
      console.error('[BannersApi] Error fetching banner for deletion:', fetchError);
      throw fetchError;
    }

    // Delete the image from storage
    if (banner?.image_url) {
      try {
        await deleteBannerImage(banner.image_url);
      } catch (imageError) {
        console.warn('[BannersApi] Could not delete image, continuing with banner deletion:', imageError);
      }
    }

    // Delete the banner record
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[BannersApi] Error deleting banner:', error);
      throw error;
    }
  } catch (error) {
    console.error('[BannersApi] Error in deleteBanner:', error);
    throw error;
  }
};

