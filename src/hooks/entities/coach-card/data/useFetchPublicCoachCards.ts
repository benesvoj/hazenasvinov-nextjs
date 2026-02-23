'use client';

import {createDataFetchHook} from '@/hooks/factories/createDataFetchHook';

import {translations} from '@/lib/translations/index';

import {CoachCardWithCategories} from '@/types';

/**
 * Hook to fetch published coach cards for a specific category
 * Uses a custom API endpoint that returns only published cards
 */
export function useFetchPublicCoachCards(params: {categoryId: string}) {
  return createDataFetchHook<CoachCardWithCategories, {categoryId: string}>({
    endpoint: (params) => `/api/coach-cards/public?categoryId=${params.categoryId}`,
    entityName: 'PublicCoachCards',
    errorMessage: translations.coachCards.toasts.fetchError,
    fetchOnMount: !!params.categoryId,
  })(params);
}
