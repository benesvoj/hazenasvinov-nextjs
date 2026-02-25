'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {translations} from '@/lib/translations/index';

import {API_ROUTES} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/trainingSessions';
import {BaseTrainingSession} from '@/types';

export function useFetchTrainingSessions(params: {categoryId: string; seasonId: string}) {
  return createDataFetchHook<BaseTrainingSession, {categoryId: string; seasonId: string}>({
    endpoint: (params) => {
      const searchParams = new URLSearchParams({
        categoryId: params.categoryId,
        seasonId: params.seasonId,
      });
      return `${API_ROUTES.entities.root(DB_TABLE)}?${searchParams.toString()}`;
    },
    entityName: ENTITY.plural,
    errorMessage: translations.trainingSessions.responseMessages.trainingSessionsFetchFailed,
    fetchOnMount: true,
  })(params);
}
