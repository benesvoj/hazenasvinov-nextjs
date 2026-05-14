'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/referees';
import {Referee} from '@/types';

export function useFetchReferees() {
  return createDataFetchHook<Referee>({
    endpoint: API_ROUTES.referees.root,
    entityName: ENTITY.plural,
    errorMessage: translations.referees.responseMessages.fetchFailed,
  })();
}
