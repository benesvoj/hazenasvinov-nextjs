'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {ClubCategoryWithRelations} from '@/types';

const t = translations.admin.clubCategories.responseMessages;

/**
 * Hook for fetching club categories
 * Generated using createDataFetchHook factory
 */
export function useFetchClubCategories() {
  return createDataFetchHook<ClubCategoryWithRelations>({
    endpoint: API_ROUTES.entities.root('club_categories'),
    entityName: 'clubCategories',
    errorMessage: t.clubCategoriesFetchFailed,
  })();
}
