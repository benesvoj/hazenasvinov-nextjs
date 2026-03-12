import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {createDataFetchHook} from '@/hooks';
import {DB_TABLE, ENTITY} from '@/queries/tournaments';
import {Tournament} from '@/types';

export function useFetchTournaments() {
  return createDataFetchHook<Tournament>({
    endpoint: API_ROUTES.entities.root(DB_TABLE),
    entityName: ENTITY.plural,
    errorMessage: translations.tournaments.responseMessages.fetchFailed,
  })();
}
