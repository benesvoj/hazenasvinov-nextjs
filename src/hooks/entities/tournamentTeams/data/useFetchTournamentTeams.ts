'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {ENTITY} from '@/queries/tournamentTeams';
import {TournamentTeamQuery} from '@/types';

export const useFetchTournamentTeams = createDataFetchHook<TournamentTeamQuery, string>({
  endpoint: (tournamentId) => API_ROUTES.tournaments.teams(tournamentId),
  entityName: ENTITY.plural,
  errorMessage: translations.tournaments.responseMessages.failedToFetchTeams,
});
