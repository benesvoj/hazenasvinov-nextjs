'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/categoryLineupMembers';
import {CategoryLineupMemberWithMember} from '@/types';

interface FetchCategoryLineupMembersParams {
  lineupId: string;
  /**
   * When `true`, members deactivated (vyřazení) in the members list are
   * returned as well. Defaults to `false` — a lineup a coach works with must
   * only contain players still available for selection.
   */
  includeInactiveMembers?: boolean;
}

export function useFetchCategoryLineupMembers(params: FetchCategoryLineupMembersParams) {
  return createDataFetchHook<CategoryLineupMemberWithMember, FetchCategoryLineupMembersParams>({
    endpoint: (params) => {
      const searchParams = new URLSearchParams({
        lineupId: params.lineupId,
      });
      if (params.includeInactiveMembers) {
        searchParams.set('includeInactiveMembers', 'true');
      }
      return `${API_ROUTES.entities.root(DB_TABLE)}?${searchParams.toString()}`;
    },
    entityName: ENTITY.plural,
    errorMessage: translations.lineupMembers.responseMessages.errorMessage,
    fetchOnMount: true,
  })(params);
}
