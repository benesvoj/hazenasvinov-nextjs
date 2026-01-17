'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/categoryLineupMembers';
import {BaseCategoryLineupMember} from '@/types';

const t = translations.coachPortal.lineupMembers.responseMessages;

export function useFetchCategoryLineupMembersFactory() {
  return createDataFetchHook<BaseCategoryLineupMember>({
    endpoint: API_ROUTES.entities.root(DB_TABLE),
    entityName: ENTITY.plural,
    errorMessage: t.lineupMembersFetchFailed,
  })();
}
