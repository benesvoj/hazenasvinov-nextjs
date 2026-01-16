'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/categoryLineups';
import {CategoryLineup} from '@/types';

const t = translations.coachPortal.lineupList.responseMessages;

export const useFetchCategoryLineups = createDataFetchHook<
  CategoryLineup,
  {categoryId: string; seasonId: string}
>({
  endpoint: (params) => {
    const searchParams = new URLSearchParams({
      categoryId: params.categoryId,
      seasonId: params.seasonId,
    });
    return `${API_ROUTES.entities.root(DB_TABLE)}?${searchParams.toString()}`;
  },
  entityName: ENTITY.plural,
  errorMessage: t.lineupsFetchFailed,
  fetchOnMount: true,
});
