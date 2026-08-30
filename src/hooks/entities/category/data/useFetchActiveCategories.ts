'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {Category} from '@/types';

/**
 * Categories the own club fields in the active season.
 *
 * Use this anywhere the public site presents "our categories". The plain
 * `useFetchCategories` returns every row in the table, which is right for the
 * admin lists and wrong for the home page: a category the club is not entering
 * this season still got a tab, and the tab rendered an empty standings table.
 */
export const useFetchActiveCategories = createDataFetchHook<Category>({
  endpoint: API_ROUTES.activeCategories,
  entityName: 'Categories',
  errorMessage: translations.categories.responseMessages.categoriesFetchFailed,
  fetchOnMount: true,
});
