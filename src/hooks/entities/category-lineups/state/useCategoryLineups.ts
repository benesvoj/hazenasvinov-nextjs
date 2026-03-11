'use client';

import {createCRUDHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/categoryLineups';
import {CategoryLineup, CreateCategoryLineup} from '@/types';

const t = translations.lineups.responseMessages;

/**
 * Hook to manage CRUD operations for category lineups
 */
export function useCategoryLineups() {
  const {loading, setLoading, error, create, update, deleteItem} = createCRUDHook<
    CategoryLineup,
    CreateCategoryLineup
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: ENTITY.plural,
    messages: {
      createSuccess: t.createSuccess,
      updateSuccess: t.updateSuccess,
      deleteSuccess: t.deleteSuccess,
      createError: t.createError,
      updateError: t.updateError,
      deleteError: t.deleteError,
    },
  })();

  return {
    loading,
    setLoading,
    error,
    createLineup: create,
    updateLineup: update,
    deleteLineup: deleteItem,
  };
}
