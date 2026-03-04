'use client';

import {createCRUDHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {Committee, CommitteeInsert} from '@/types';

/**
 * Hook for managing committees (CRUD operations)
 * Generated using createCRUDHook factory
 */
export function useCommittees() {
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<
    Committee,
    CommitteeInsert
  >({
    baseEndpoint: API_ROUTES.entities.root('committees'),
    byIdEndpoint: (id) => API_ROUTES.entities.byId('committees', id),
    entityName: 'committee',
    messages: {
      createSuccess: translations.committees.responseMessages.createSuccess,
      updateSuccess: translations.committees.responseMessages.updateSuccess,
      deleteSuccess: translations.committees.responseMessages.deleteSuccess,
      createError: translations.committees.responseMessages.createError,
      updateError: translations.committees.responseMessages.updateError,
      deleteError: translations.committees.responseMessages.deleteError,
    },
  })();

  return {
    loading,
    error,
    createCommittee: create,
    updateCommittee: update,
    deleteCommittee: deleteItem,
    setLoading,
  };
}
