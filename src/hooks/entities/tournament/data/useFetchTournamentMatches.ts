'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {TournamentMatch} from '@/types';

export const useFetchTournamentMatches = createDataFetchHook<TournamentMatch, string>({
  endpoint: (tournamentId) => API_ROUTES.tournaments.matches(tournamentId),
  entityName: 'TournamentMatches',
  errorMessage: translations.tournaments.responseMessages.fetchFailed,
});
