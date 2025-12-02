'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {Season} from '@/types';

const t = translations.admin.seasons.responseMessages;

/**
 * Hook for fetching seasons
 * Generated using createDataFetchHook factory
 */
export const useFetchSeasons = createDataFetchHook<Season>({
  endpoint: API_ROUTES.entities.root('seasons'),
  entityName: 'seasons',
  errorMessage: t.seasonsFetchFailed,
});
