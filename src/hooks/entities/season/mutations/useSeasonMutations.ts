'use client';

import {useMutation, useQueryClient} from '@tanstack/react-query';

import {translations} from '@/lib/translations/index';

import {showToast} from '@/components';
import {useSupabaseClient} from '@/hooks';
import {Season, SeasonInsert} from '@/types';

export function useSeasonMutations(options?: {onSuccess?: () => void}) {
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();

  const createSeason = useMutation({
    mutationFn: async (data: SeasonInsert) => {
      const {data: created, error} = await supabase.from('seasons').insert(data).select().single();

      if (error) throw error;
      return created;
    },
    onSuccess: (data) => {
      showToast.success(translations.seasons.responseMessages.createSuccess);
      queryClient.invalidateQueries({queryKey: ['seasons']});
      options?.onSuccess?.();
    },
    onError: (error: any) => {
      showToast.danger(error.message || translations.seasons.responseMessages.createError);
    },
  });

  const updateSeason = useMutation({
    mutationFn: async ({id, data}: {id: string; data: Partial<Season>}) => {
      const {data: updated, error} = await supabase
        .from('seasons')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      showToast.success(translations.seasons.responseMessages.updateSuccess);
      queryClient.invalidateQueries({queryKey: ['seasons']});
      options?.onSuccess?.();
    },
    onError: (error: any) => {
      showToast.danger(error.message || translations.seasons.responseMessages.updateError);
    },
  });

  const deleteSeason = useMutation({
    mutationFn: async (id: string) => {
      const {error} = await supabase.from('seasons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      showToast.success(translations.seasons.responseMessages.deleteSuccess);
      queryClient.invalidateQueries({queryKey: ['seasons']});
      options?.onSuccess?.();
    },
    onError: (error: any) => {
      showToast.danger(error.message || translations.seasons.responseMessages.deleteError);
    },
  });

  return {
    createSeason: (data: SeasonInsert) => createSeason.mutateAsync(data),
    updateSeason: (id: string, data: Partial<Season>) => updateSeason.mutateAsync({id, data}),
    deleteSeason: (id: string) => deleteSeason.mutateAsync(id),
    loading: createSeason.isPending || updateSeason.isPending || deleteSeason.isPending,
  };
}
