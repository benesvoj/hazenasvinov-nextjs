import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/grants';
import {Grant} from '@/types';

const t = translations.admin.grants.responseMessages;

export function useFetchGrants() {
  return createDataFetchHook<Grant>({
    endpoint: API_ROUTES.entities.root(DB_TABLE),
    entityName: ENTITY.plural,
    errorMessage: t.grantsFetchFailed,
  })();
}
