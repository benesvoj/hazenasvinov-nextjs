import {Category, UseCategoriesFilters} from '@/types';

export const useCategoryFiltering = (data: Category[], filters?: UseCategoriesFilters) => {
  const filteredData = !filters?.searchTerm
    ? data
    : data.filter(
        (category) =>
          category.name.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
          (category.description &&
            category.description.toLowerCase().includes(filters.searchTerm!.toLowerCase()))
      );

  return {
    filteredData,
  };
};
