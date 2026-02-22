'use client';

import {useEffect, useMemo} from 'react';

import {createDataFetchHook} from '@/hooks/factories';

import {translations} from '@/lib/translations/index';

import {API_ROUTES} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/coachCards';
import {CoachCard} from '@/types';

// Base hook created by factory (returns array)
const useBaseFetchCoachCard = createDataFetchHook<CoachCard, {userId: string}>({
  endpoint: (params) => {
    const searchParams = new URLSearchParams();
    searchParams.set('userId', params.userId);
    return `${API_ROUTES.coachCards.root}?${searchParams.toString()}`;
  },
  entityName: ENTITY.singular,
  errorMessage: translations.coachCards.toasts.fetchError,
  fetchOnMount: false, // We'll control this manually
});

/**
 * Hook to fetch coach card for a specific user.
 * Wraps the factory hook to extract single item from array.
 * Returns CoachCard | null instead of CoachCard[].
 */
export function useFetchCoachCard(params: {userId: string}) {
  const {data: dataArray, loading, error, refetch} = useBaseFetchCoachCard(params);

  // Extract single item from array (user has one card max)
  const data = useMemo(() => {
    return dataArray.length > 0 ? dataArray[0] : null;
  }, [dataArray]);

  // Only fetch if userId is provided
  useEffect(() => {
    if (params.userId) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.userId]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
