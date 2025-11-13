'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {Committee} from '@/types';

const t = translations.admin.committees.responseMessages;

/**
 * Hook for fetching committees
 * Generated using createDataFetchHook factory
 */
export const useFetchCommittees = createDataFetchHook<Committee>({
  endpoint: API_ROUTES.entities.root('committees'),
  entityName: 'committees',
  errorMessage: t.committeesFetchFailed,
});
