'use client';

import {useCallback, useEffect, useState} from 'react';

import {API_ROUTES, translations} from '@/lib';
import {Category, UseCategoriesFilters} from '@/types';

export function useFetchCategories(filters?: UseCategoriesFilters) {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const t = translations.categories.responseMessages;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.categories.root);
      const response = await res.json();

      setData(response.data || []);
    } catch (error) {
      console.error(t.categoriesFetchFailed, error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter categories based on search term
  const getFilteredCategories = useCallback(() => {
    if (!filters?.searchTerm) return data;

    return data.filter(
      (category) =>
        category.name.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        (category.description &&
          category.description.toLowerCase().includes(filters.searchTerm!.toLowerCase()))
    );
  }, [data, filters?.searchTerm]);

  return {
    data: getFilteredCategories(),
    loading,
    error,
    refetch: fetchData,
  };
}
