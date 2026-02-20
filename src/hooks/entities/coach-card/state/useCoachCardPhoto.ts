'use client';

import {useCallback, useState} from 'react';

import {translations} from '@/lib/translations/index';

import {showToast} from '@/components';
import {useSupabaseClient} from '@/hooks';

const STORAGE_BUCKET = 'coach-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Hook for coach card photo operations (upload/delete)
 * Photo operations use Supabase Storage directly, not the entities API
 */
export function useCoachCardPhoto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();

  const uploadPhoto = useCallback(
    async (file: File, userId: string): Promise<{url: string; path: string} | null> => {
      // validation
      if (!file.type.startsWith('image/')) {
        showToast.warning(translations.coachCards.validation.invalidImageType);
        return null;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast.warning(translations.coachCards.validation.imageTooLarge);
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const fileExt = file.name.split('.').pop();
        const path = `${userId}/${Date.now()}.${fileExt}`;

        const {error: uploadError} = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, {upsert: true});

        if (uploadError) throw uploadError;

        const {data: urlData} = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

        return {url: urlData.publicUrl, path};
      } catch (err) {
        console.error('Error uploading photo: ', err);
        const errorMsg =
          err instanceof Error ? err.message : translations.coachCards.toasts.photoUploadError;
        setError(errorMsg);
        showToast.danger(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deletePhoto = useCallback(async (path: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const {error: deleteError} = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

      if (deleteError) throw deleteError;

      return true;
    } catch (err) {
      console.error('Error deleting photo: ', err);
      const errorMsg =
        err instanceof Error ? err.message : translations.coachCards.toasts.photoDeleteError;
      setError(errorMsg);
      showToast.danger(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  return {
    loading,
    error,
    uploadPhoto,
    deletePhoto,
    clearError,
  };
}
