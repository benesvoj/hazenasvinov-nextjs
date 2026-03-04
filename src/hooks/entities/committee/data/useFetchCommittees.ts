'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {Committee} from '@/types';

/**
 * Hook for fetching committees
 * Generated using createDataFetchHook factory
 */
export function useFetchCommittees() {
  return createDataFetchHook<Committee>({
    endpoint: API_ROUTES.entities.root('committees'),
    entityName: 'committees',
    errorMessage: translations.committees.responseMessages.committeesFetchFailed,
  })();
}
