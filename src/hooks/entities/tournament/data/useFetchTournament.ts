'use client';

import {createSingleEntityFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/tournaments';
import {Tournament} from '@/types';

export const useFetchTournament = createSingleEntityFetchHook<Tournament, string>({
  endpoint: (tournamentId) => API_ROUTES.entities.byId(DB_TABLE, tournamentId),
  entityName: ENTITY.singular,
  errorMessage: translations.tournaments.responseMessages.fetchFailed,
});
