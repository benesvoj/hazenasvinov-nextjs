'use client';

import {createDataFetchHook} from '@/hooks/factories/createDataFetchHook';

import {translations} from '@/lib/translations/index';

import {API_ROUTES} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/roleDefinitions';
import {RoleDefinitionSchema} from '@/types';

const useBaseFetchRoleDefinitions = createDataFetchHook<RoleDefinitionSchema>({
  endpoint: API_ROUTES.entities.root(DB_TABLE),
  entityName: ENTITY.plural,
  errorMessage: translations.admin.roleDefinitions.responseMessages.fetchFailed,
});

export function useFetchRoleDefinitions() {
  const {data, loading, error, refetch} = useBaseFetchRoleDefinitions();

  return {
    data,
    loading,
    error,
    refetch,
  };
}
