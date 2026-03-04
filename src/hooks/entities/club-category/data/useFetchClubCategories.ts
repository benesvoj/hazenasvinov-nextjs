'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {ClubCategoryWithRelations} from '@/types';

const t = translations.clubCategories.responseMessages;

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
