'use client';

import {useCallback, useState} from 'react';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {showToast} from '@/components';

export function useScheduleGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSchedule = useCallback(async (tournamentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(API_ROUTES.tournaments.scheduleGenerate(tournamentId), {
        method: 'POST',
      });
      const response = await res.json();

      if (!res.ok) {
        throw new Error(
          response.error || translations.tournaments.responseMessages.scheduleGenerateError
        );
      }

      showToast.success(translations.tournaments.responseMessages.scheduleGenerated);
      return true;
    } catch (err: any) {
      const errorMsg =
        err.message || translations.tournaments.responseMessages.scheduleGenerateError;
      setError(errorMsg);
      showToast.danger(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {generateSchedule, loading, error};
}
