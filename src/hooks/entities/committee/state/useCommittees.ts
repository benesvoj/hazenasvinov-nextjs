'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {Committee, CommitteeInsert} from '@/types';

const t = translations.admin.committees.responseMessages;

/**
 * Hook for managing committees (CRUD operations)
 * Generated using createCRUDHook factory
 */
const _useCommittees = createCRUDHook<Committee, CommitteeInsert>({
  baseEndpoint: API_ROUTES.entities.root('committees'),
  byIdEndpoint: (id) => API_ROUTES.entities.byId('committees', id),
  entityName: 'committee',
  messages: {
    createSuccess: t.createSuccess,
    updateSuccess: t.updateSuccess,
    deleteSuccess: t.deleteSuccess,
    createError: t.createError,
    updateError: t.updateError,
    deleteError: t.deleteError,
  },
});

/**
 * Wrapper to maintain backward compatibility with existing API
 * Maps factory hook methods to expected names
 */
export function useCommittees() {
  const {loading, error, create, update, deleteItem, setLoading} = _useCommittees();

  return {
    loading,
    error,
    createCommittee: create,
    updateCommittee: update,
    deleteCommittee: deleteItem,
    setLoading,
  };
}
