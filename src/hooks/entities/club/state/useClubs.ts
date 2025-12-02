'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {Club, ClubInsert} from '@/types';

const t = translations.admin.clubs.responseMessages;

/**
 * Hook for managing clubs (CRUD operations)
 * Generated using createCRUDHook factory
 */
const _useClubs = createCRUDHook<Club, ClubInsert>({
  baseEndpoint: API_ROUTES.entities.root('clubs'),
  byIdEndpoint: (id) => API_ROUTES.entities.byId('clubs', id),
  entityName: 'club',
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
export function useClubs() {
  const {loading, setLoading, error, create, update, deleteItem} = _useClubs();

  return {
    loading,
    error,

    createClub: create,
    updateClub: update,
    deleteClub: deleteItem,

    setLoading,
  };
}
