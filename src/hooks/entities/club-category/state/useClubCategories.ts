'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/clubCategories';
import {ClubCategoryInsert, ClubCategorySchema} from '@/types';

const t = translations.admin.clubCategories.responseMessages;
/**
 * Wrapper to maintain backward compatibility with existing API
 * Maps factory hook methods to expected names
 */
export function useClubCategories() {
  const {loading, setLoading, error, create, update, deleteItem} = createCRUDHook<
    ClubCategorySchema,
    ClubCategoryInsert
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
    error,
    createClubCategory: create,
    updateClubCategory: update,
    deleteClubCategory: deleteItem,
    setLoading,
  };
}
