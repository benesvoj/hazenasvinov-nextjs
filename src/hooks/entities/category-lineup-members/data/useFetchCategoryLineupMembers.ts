'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/categoryLineupMembers';
import {CategoryLineupMemberWithMember} from '@/types';

export function useFetchCategoryLineupMembers(params: {lineupId: string}) {
  return createDataFetchHook<CategoryLineupMemberWithMember, {lineupId: string}>({
    endpoint: (params) => {
      const searchParams = new URLSearchParams({
        lineupId: params.lineupId,
      });
      return `${API_ROUTES.entities.root(DB_TABLE)}?${searchParams.toString()}`;
    },
    entityName: ENTITY.plural,
    errorMessage: translations.lineupMembers.responseMessages.errorMessage,
    fetchOnMount: true,
  })(params);
}
