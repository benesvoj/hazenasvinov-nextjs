'use client';

import {useCallback, useState} from 'react';

import {isEmpty} from '@/utils/arrayHelper';

import {useStandings} from '@/hooks';
import {calculateStandings, generateInitialStandings, resetAndRecalculateStandings} from '@/utils';

export function useMatchesStandings(selectedCategory: string, selectedSeasonId: string) {
  const [error, setError] = useState('');
  const {standings, fetchStandings, loading: standingsLoading} = useStandings();

  const refresh = useCallback(async () => {
    if (selectedCategory && selectedSeasonId) {
      await fetchStandings(selectedCategory, selectedSeasonId);
    }
  }, [fetchStandings, selectedCategory, selectedSeasonId]);

  const hasStandings = !isEmpty(
    standings.filter((s) => s.category_id === selectedCategory && s.season_id === selectedSeasonId)
  );

  const handleCalculate = useCallback(
    async (isSeasonClosed: boolean) => {
      const result = await calculateStandings(selectedCategory, selectedSeasonId, isSeasonClosed);
      if (result.success) {
        await refresh();
        setError('');
      } else {
        setError(result.error || 'Chyba při výpočtu tabulky');
      }
    },
    [selectedCategory, selectedSeasonId, refresh]
  );

  const handleGenerateInitial = useCallback(
    async (isSeasonClosed: boolean) => {
      const result = await generateInitialStandings(
        selectedCategory,
        selectedSeasonId,
        isSeasonClosed
      );
      if (result.success) {
        await refresh();
        setError('');
      } else {
        setError(result.error || 'Chyba při generování počáteční tabulky');
      }
    },
    [selectedCategory, selectedSeasonId, refresh]
  );

  const handleResetAndRecalculate = useCallback(
    async (isSeasonClosed: boolean) => {
      const result = await resetAndRecalculateStandings(
        selectedCategory,
        selectedSeasonId,
        isSeasonClosed
      );
      if (result.success) {
        await refresh();
        setError('');
      } else {
        setError(result.error || 'Chyba při resetování tabulky');
      }
    },
    [selectedCategory, selectedSeasonId, refresh]
  );

  const handleStandingsAction = useCallback(
    async (isSeasonClosed: boolean) => {
      if (isSeasonClosed) {
        setError('Nelze upravovat tabulku pro uzavřenou sezónu');
        return;
      }
      if (hasStandings) {
        await handleCalculate(isSeasonClosed);
      } else {
        await handleGenerateInitial(isSeasonClosed);
      }
    },
    [hasStandings, handleCalculate, handleGenerateInitial]
  );

  return {
    standings,
    standingsLoading,
    hasStandings,
    error,
    setError,
    refresh,
    handleCalculate,
    handleGenerateInitial,
    handleResetAndRecalculate,
    handleStandingsAction,
  };
}
