'use client';

import {useCallback, useState} from 'react';

import {translations} from '@/lib/translations/index';

import {showToast} from '@/components';
import {API_ROUTES} from '@/lib';
import {TrainingSessionInsert} from '@/types';

interface BulkCreatedResult {
  sessionsCreated: number;
  attendanceCreated: number;
}

export const useBulkCreateTrainingSessions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkCreate = useCallback(
    async (
      sessions: TrainingSessionInsert[],
      memberIds: string[] = []
    ): Promise<BulkCreatedResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.trainingSessions.bulk, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({sessions, memberIds}),
        });

        const responseData = await response.json();

        if (!response.ok || responseData.error) {
          setError(responseData.error || 'Failed to bulk create training sessions');
          throw new Error(responseData.error || 'Failed to bulk create training sessions');
        }

        const result = responseData.data as BulkCreatedResult;

        showToast.success(
          translations.trainingSessions.responseMessages.trainingGenerationSummary(
            result.sessionsCreated,
            0
          )
        );
        return result;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        showToast.danger(translations.trainingSessions.responseMessages.createError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    bulkCreate,
    loading,
    error,
  };
};
