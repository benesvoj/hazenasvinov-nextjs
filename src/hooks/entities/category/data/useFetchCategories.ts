'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {Category} from '@/types';

const t = translations.categories.responseMessages;

/**
 * Hook for fetching categories
 * Generated using createDataFetchHook factory
 */
export function useFetchCategories() {
  return createDataFetchHook<Category>({
    endpoint: API_ROUTES.entities.root('categories'),
    entityName: 'categories',
    errorMessage: t.categoriesFetchFailed,
  })();
}
