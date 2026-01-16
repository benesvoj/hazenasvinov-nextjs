/**
 * Hook to manage CRUD operations for category lineups
 */

'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/categoryLineups';
import {CategoryLineup, CreateCategoryLineup} from '@/types';

const t = translations.coachPortal.lineupList.responseMessages;

const _useCategoryLineups = createCRUDHook<CategoryLineup, CreateCategoryLineup>({
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
});

export function useCategoryLineups() {
  const {loading, setLoading, error, create, update, deleteItem} = _useCategoryLineups();

  return {
    loading,
    setLoading,
    error,
    createLineup: create,
    updateLineup: update,
    deleteLineup: deleteItem,
  };
}
