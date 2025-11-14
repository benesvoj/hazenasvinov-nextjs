'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {Category, CategoryInsert} from '@/types';

const t = translations.categories.responseMessages;

/**
 * Hook for managing categories (CRUD operations)
 * Generated using createCRUDHook factory
 */
const _useCategories = createCRUDHook<Category, CategoryInsert>({
  baseEndpoint: API_ROUTES.entities.root('categories'),
  byIdEndpoint: (id) => API_ROUTES.entities.byId('categories', id),
  entityName: 'category',
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
export function useCategories() {
  const {loading, error, create, update, deleteItem, setLoading} = _useCategories();

  return {
    loading,
    setLoading,
    error,
    createCategory: create,
    updateCategory: update,
    deleteCategory: deleteItem,
  };
}
