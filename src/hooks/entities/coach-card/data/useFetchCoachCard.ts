'use client';

import {useCallback, useEffect, useState} from 'react';

import {translations} from '@/lib/translations/index';

import {showToast} from '@/components';
import {API_ROUTES} from '@/lib';
import {CoachCard} from '@/types';

/**
 * Hook to fetch the authenticated user's own coach card.
 *
 * The GET endpoint uses the session to resolve the user — no userId param needed.
 * Returns CoachCard | null (null = no card created yet, not an error).
 */
export function useFetchCoachCard() {
  const [data, setData] = useState<CoachCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ROUTES.coachCards.root);

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        const message = json?.error ?? translations.coachCards.toasts.fetchError;
        setError(message);
        showToast.danger(message);
        return;
      }

      const json = await response.json();
      // API returns { data: CoachCard | null }
      setData(json.data ?? null);
    } catch {
      const message = translations.coachCards.toasts.fetchError;
      setError(message);
      showToast.danger(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {data, loading, error, refetch};
}
