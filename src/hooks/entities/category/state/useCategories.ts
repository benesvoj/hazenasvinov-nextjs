'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES, translations} from '@/lib';
import {Category, CategoryInsert} from '@/types';

const t = translations.categories.responseMessages;

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create category
  const createCategory = useCallback(async (data: CategoryInsert) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.categories.root, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || t.categoryCreationFailed);
      }

      showToast.success(t.categoryCreationSuccess);
      setCategories((prev) => [...prev, response.data]);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.categoryCreationFailed;
      setError(errorMessage);
      console.error(t.categoryCreationFailed, error);
      return {success: false, error: errorMessage};
    }
  }, []);

  // Update category
  const updateCategory = useCallback(async (id: string, data: Partial<CategoryInsert>) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.categories.byId(id), {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || t.categoryUpdateFailed);
      }

      showToast.success(t.categoryUpdatedSuccess);
      setCategories((prev) => prev.map((cat) => (cat.id === id ? response.data : cat)));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.categoryUpdateFailed;
      setError(errorMessage);
      console.error('Error updating category:', error);
      return {success: false, error: errorMessage};
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.categories.byId(id), {
        method: 'DELETE',
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || t.categoryDeleteFailed);
      }

      showToast.success(t.categoryDeleteSuccess);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      return {success: true};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.categoryDeleteFailed;
      setError(errorMessage);
      console.error('Error deleting category:', error);
      return {success: false, error: errorMessage};
    }
  }, []);

  return {
    // Data
    categories,

    // State
    loading,
    error,

    // Actions
    createCategory,
    updateCategory,
    deleteCategory,

    // Setters
    setLoading,

    // Utilities
    clearError: () => setError(null),
  };
}
