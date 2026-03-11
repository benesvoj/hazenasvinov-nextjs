'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {Season} from '@/types';

const t = translations.seasons.responseMessages;

/**
 * Hook for fetching seasons
 * Generated using createDataFetchHook factory
 */
export function useFetchSeasons() {
  return createDataFetchHook<Season>({
    endpoint: API_ROUTES.entities.root('seasons'),
    entityName: 'seasons',
    errorMessage: t.fetchFailed,
  })();
}
