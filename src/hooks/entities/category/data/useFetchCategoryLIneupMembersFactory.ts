'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/categoryLineupMembers';
import {BaseCategoryLineupMember} from '@/types';

const t = translations.lineupMembers.responseMessages;

export function useFetchCategoryLineupMembersFactory() {
  return createDataFetchHook<BaseCategoryLineupMember>({
    endpoint: API_ROUTES.entities.root(DB_TABLE),
    entityName: ENTITY.plural,
    errorMessage: t.lineupMembersFetchFailed,
  })();
}
