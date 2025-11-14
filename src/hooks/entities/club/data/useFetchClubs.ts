'use client';

import {createDataFetchHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {Club} from '@/types';

const t = translations.admin.clubs.responseMessages;

/**
 * Hook for fetching clubs
 * Generated using createDataFetchHook factory
 */
export const useFetchClubs = createDataFetchHook<Club>({
  endpoint: API_ROUTES.entities.root('clubs'),
  entityName: 'clubs',
  errorMessage: t.clubsFetchError,
});
