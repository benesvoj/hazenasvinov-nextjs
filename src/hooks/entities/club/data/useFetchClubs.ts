'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {Club} from '@/types';

/**
 * Hook for fetching clubs
 * Generated using createDataFetchHook factory
 */
export function useFetchClubs() {
  return createDataFetchHook<Club>({
    endpoint: API_ROUTES.entities.root('clubs'),
    entityName: 'clubs',
    errorMessage: translations.clubs.responseMessages.clubsFetchError,
  })();
}
