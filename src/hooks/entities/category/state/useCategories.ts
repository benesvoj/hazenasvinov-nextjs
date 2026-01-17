'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/categories';
import {Category, CategoryInsert} from '@/types';

const t = translations.admin.categories.responseMessages;

/**
 * Wrapper to maintain backward compatibility with existing API
 * Maps factory hook methods to expected names
 */
export function useCategories() {
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<
    Category,
    CategoryInsert
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
    createCategory: create,
    updateCategory: update,
    deleteCategory: deleteItem,
  };
}
