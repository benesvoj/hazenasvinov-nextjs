'use client';

import {createDataFetchHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {Category} from '@/types';

const t = translations.admin.categories.responseMessages;

/**
 * Hook for fetching categories
 * Generated using createDataFetchHook factory
 */
export const useFetchCategories = createDataFetchHook<Category>({
  endpoint: API_ROUTES.entities.root('categories'),
  entityName: 'categories',
  errorMessage: t.categoriesFetchFailed,
});
