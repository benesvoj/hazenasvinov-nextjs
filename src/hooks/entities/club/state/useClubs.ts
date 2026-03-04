'use client';

import {createCRUDHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/clubs';
import {Club, ClubInsert} from '@/types';

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
        createSuccess: translations.clubs.responseMessages.createSuccess,
        updateSuccess: translations.clubs.responseMessages.updateSuccess,
        deleteSuccess: translations.clubs.responseMessages.deleteSuccess,
        createError: translations.clubs.responseMessages.createError,
        updateError: translations.clubs.responseMessages.updateError,
        deleteError: translations.clubs.responseMessages.deleteError,
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
