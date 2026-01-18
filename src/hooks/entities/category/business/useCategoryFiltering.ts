import {useCallback, useMemo} from 'react';

import {Category, UseCategoriesFilters} from '@/types';

export const useCategoryFiltering = (data: Category[], filters?: UseCategoriesFilters) => {
  const getFilteredCategories = useCallback(() => {
    if (!filters?.searchTerm) return data;

    return data.filter(
      (category) =>
        category.name.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        (category.description &&
          category.description.toLowerCase().includes(filters.searchTerm!.toLowerCase()))
    );
  }, [data, filters?.searchTerm]);

  const filteredData = useMemo(() => getFilteredCategories(), [data, filters?.searchTerm]);

  return {
    filteredData,
  };
};
