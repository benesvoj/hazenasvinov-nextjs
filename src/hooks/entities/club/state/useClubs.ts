'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/clubs';
import {Club, ClubInsert} from '@/types';

const t = translations.admin.clubs.responseMessages;

/**
 * Hook for managing clubs (CRUD operations)
 * Generated using createCRUDHook factory
 */
export function useClubs() {
  const {loading, setLoading, error, create, update, deleteItem} = createCRUDHook<Club, ClubInsert>(
    {
      baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
      byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
      entityName: ENTITY.singular,
      messages: {
        createSuccess: t.createSuccess,
        updateSuccess: t.updateSuccess,
        deleteSuccess: t.deleteSuccess,
        createError: t.createError,
        updateError: t.updateError,
        deleteError: t.deleteError,
      },
    }
  )();

  return {
    loading,
    error,

    createClub: create,
    updateClub: update,
    deleteClub: deleteItem,

    setLoading,
  };
}
