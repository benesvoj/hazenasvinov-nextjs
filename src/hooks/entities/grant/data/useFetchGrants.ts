import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/grants';
import {Grant} from '@/types';

const t = translations.grantCalendar.responseMessages;

export function useFetchGrants() {
  return createDataFetchHook<Grant>({
    endpoint: API_ROUTES.entities.root(DB_TABLE),
    entityName: ENTITY.plural,
    errorMessage: t.grantsFetchFailed,
  })();
}
