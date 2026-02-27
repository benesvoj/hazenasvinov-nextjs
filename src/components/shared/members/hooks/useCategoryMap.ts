import {useMemo} from 'react';

import {Category} from '@/types';

export function useCategoryMap(
  categoriesData: Category[] | Record<string, string> | null | undefined
): Record<string, string> {
  return useMemo(() => {
    if (!categoriesData) return {};
    if (Array.isArray(categoriesData)) {
      return categoriesData.reduce(
        (acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        },
        {} as Record<string, string>
      );
    }
    return categoriesData;
  }, [categoriesData]);
}
