'use client';

import {useMutation, useQueryClient} from '@tanstack/react-query';

import {createClient} from '@/utils/supabase/client';

import {showToast} from '@/components';
import {translations} from '@/lib';
import {Season, SeasonInsert} from '@/types';

const t = translations.season.responseMessages;

export function useSeasonMutations(options?: {onSuccess?: () => void}) {
	const queryClient = useQueryClient();

	const createSeason = useMutation({
		mutationFn: async (data: SeasonInsert) => {
			const supabase = createClient();
			const {data: created, error} = await supabase
				.from('seasons')
				.insert(data)
				.select()
				.single();

			if (error) throw error;
			return created;
		},
		onSuccess: (data) => {
			showToast.success(t.createSuccess);
			queryClient.invalidateQueries({queryKey: ['seasons']});
			options?.onSuccess?.();
		},
		onError: (error: any) => {
			showToast.danger(error.message || t.createError);
		},
	});

	const updateSeason = useMutation({
		mutationFn: async ({id, data}: {id: string; data: Partial<Season>}) => {
			const supabase = createClient();
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
			showToast.success(t.updateSuccess);
			queryClient.invalidateQueries({queryKey: ['seasons']});
			options?.onSuccess?.();
		},
		onError: (error: any) => {
			showToast.danger(error.message || t.updateError);
		},
	});

	const deleteSeason = useMutation({
		mutationFn: async (id: string) => {
			const supabase = createClient();
			const {error} = await supabase.from('seasons').delete().eq('id', id);
			if (error) throw error;
		},
		onSuccess: () => {
			showToast.success(t.deleteSuccess);
			queryClient.invalidateQueries({queryKey: ['seasons']});
			options?.onSuccess?.();
		},
		onError: (error: any) => {
			showToast.danger(error.message || t.deleteError);
		},
	});

	return {
		createSeason: (data: SeasonInsert) => createSeason.mutateAsync(data),
		updateSeason: (id: string, data: Partial<Season>) => updateSeason.mutateAsync({id, data}),
		deleteSeason: (id: string) => deleteSeason.mutateAsync(id),
		loading: createSeason.isPending || updateSeason.isPending || deleteSeason.isPending,
	};
}