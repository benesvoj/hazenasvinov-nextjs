'use client';

import {useCallback, useState} from 'react';

import {useQueryClient} from '@tanstack/react-query';

import {translations} from '@/lib/translations/index';

import {autoRecalculateStandings} from '@/utils/autoStandingsRecalculation';
import {refreshMaterializedViewWithCallback} from '@/utils/refreshMaterializedView';
import {createClient} from '@/utils/supabase/client';

import {showToast} from '@/components';
import {
  createMatch as createMatchMutation,
  updateMatch as updateMatchMutation,
  deleteMatch as deleteMatchMutation,
  bulkUpdateMatchweek as bulkUpdateMutation,
} from '@/queries/matches';
import {
  MatchInsertData,
  MatchUpdateData,
  MatchResultData,
  BulkMatchweekUpdateData,
} from '@/queries/matches/types';
import {Match} from '@/types';

export interface UseMatchMutationsOptions {
  selectedCategory: string;
  selectedSeason: string;
  onStandingsRefresh?: () => Promise<void>;
}

export interface UseMatchMutationsResult {
  loading: boolean;
  error: string | null;
  createMatch: (data: MatchInsertData) => Promise<boolean>;
  updateMatch: (matchId: string, data: MatchUpdateData, originalMatch: Match) => Promise<boolean>;
  updateMatchResult: (matchId: string, data: MatchResultData) => Promise<boolean>;
  deleteMatch: (matchId: string) => Promise<boolean>;
  deleteAllMatchesBySeason: (seasonId: string) => Promise<boolean>;
  bulkUpdateMatchweek: (data: BulkMatchweekUpdateData, matches: Match[]) => Promise<boolean>;
  clearError: () => void;
}

export function useMatchMutations(options: UseMatchMutationsOptions): UseMatchMutationsResult {
  const {selectedCategory, selectedSeason, onStandingsRefresh} = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const invalidateMatchQueries = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ['matches', 'seasonal', selectedCategory, selectedSeason],
    });
    await queryClient.invalidateQueries({
      queryKey: ['matches'],
    });
  }, [queryClient, selectedCategory, selectedSeason]);

  const createMatch = useCallback(
    async (data: MatchInsertData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const {error: insertError} = await supabase.from('matches').insert(data);

        if (insertError) throw insertError;

        await refreshMaterializedViewWithCallback('admin match insert');
        await invalidateMatchQueries();

        return true;
      } catch (err: any) {
        setError(err.message || 'Chyba při přidávání zápasu');
        console.error('Error adding match:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, invalidateMatchQueries]
  );

  const updateMatch = useCallback(
    async (matchId: string, data: MatchUpdateData, originalMatch: Match): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const {error: updateError} = await supabase.from('matches').update(data).eq('id', matchId);

        if (updateError) throw updateError;

        await refreshMaterializedViewWithCallback('admin match update');

        // Check if scores were updated
        const scoresWereUpdated =
          data.home_score !== originalMatch.home_score ||
          data.away_score !== originalMatch.away_score ||
          data.home_score_halftime !== originalMatch.home_score_halftime ||
          data.away_score_halftime !== originalMatch.away_score_halftime;

        if (scoresWereUpdated) {
          const standingsResult = await autoRecalculateStandings(matchId);

          if (standingsResult.success && standingsResult.recalculated) {
            await onStandingsRefresh?.();
            showToast.success(translations.matches.toasts.matchSavedWithUpdateStandingTable);
          } else if (standingsResult.success && !standingsResult.recalculated) {
            showToast.success(translations.matches.toasts.matchSavedSuccessfully);
          } else {
            showToast.warning(translations.matches.toasts.matchSavedWithoutUpdateStandingTable);
          }
        } else {
          showToast.warning(translations.matches.toasts.matchSavedWithoutUpdatedScore);
        }

        await invalidateMatchQueries();
        return true;
      } catch (err: any) {
        setError(err.message || 'Chyba při aktualizaci zápasu');
        console.error('Error updating match:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, invalidateMatchQueries, onStandingsRefresh]
  );

  const updateMatchResult = useCallback(
    async (matchId: string, data: MatchResultData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const {error: updateError} = await supabase
          .from('matches')
          .update({
            home_score: data.home_score,
            away_score: data.away_score,
            home_score_halftime: data.home_score_halftime,
            away_score_halftime: data.away_score_halftime,
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', matchId);

        if (updateError) throw updateError;

        await refreshMaterializedViewWithCallback('admin result update');

        const standingsResult = await autoRecalculateStandings(matchId);

        if (standingsResult.success && standingsResult.recalculated) {
          await onStandingsRefresh?.();
          showToast.success(translations.matches.toasts.matchWithResultWasSaved);
        } else if (standingsResult.success && !standingsResult.recalculated) {
          showToast.success(translations.matches.toasts.matchResultWasSaved);
        } else {
          showToast.warning(translations.matches.toasts.matchResultSavedWithoutUpdateStandingTable);
        }

        await invalidateMatchQueries();
        return true;
      } catch (err: any) {
        setError(err.message || 'Chyba při aktualizaci výsledku');
        console.error('Error updating result:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, invalidateMatchQueries, onStandingsRefresh]
  );

  const deleteMatch = useCallback(
    async (matchId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const {error: deleteError} = await supabase.from('matches').delete().eq('id', matchId);

        if (deleteError) throw deleteError;

        await refreshMaterializedViewWithCallback('admin match delete');
        await invalidateMatchQueries();

        return true;
      } catch (err: any) {
        setError(err.message || 'Chyba při mazání zápasu');
        console.error('Error deleting match:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, invalidateMatchQueries]
  );

  const deleteAllMatchesBySeason = useCallback(
    async (seasonId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const {error: deleteError} = await supabase
          .from('matches')
          .delete()
          .eq('season_id', seasonId);

        if (deleteError) throw deleteError;

        await invalidateMatchQueries();
        return true;
      } catch (err: any) {
        setError(err.message || 'Chyba při mazání všech zápasů');
        console.error('Error deleting all matches:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, invalidateMatchQueries]
  );

  const bulkUpdateMatchweek = useCallback(
    async (data: BulkMatchweekUpdateData, matches: Match[]): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        let matchesToUpdate: Match[];
        let updateData: {matchweek: number | null};

        if (data.action === 'set') {
          matchesToUpdate = matches.filter(
            (match) => match.category_id === data.categoryId && !match.matchweek
          );

          if (matchesToUpdate.length === 0) {
            setError('Nebyly nalezeny žádné zápasy bez kola pro vybranou kategorii');
            return false;
          }

          updateData = {matchweek: parseInt(data.matchweek)};
        } else {
          matchesToUpdate = matches.filter(
            (match) =>
              match.category_id === data.categoryId &&
              match.matchweek !== null &&
              match.matchweek !== undefined
          );

          if (matchesToUpdate.length === 0) {
            setError('Nebyly nalezeny žádné zápasy s kolem pro vybranou kategorii');
            return false;
          }

          updateData = {matchweek: null};
        }

        const {error: updateError} = await supabase
          .from('matches')
          .update(updateData)
          .in(
            'id',
            matchesToUpdate.map((match) => match.id)
          );

        if (updateError) throw updateError;

        await refreshMaterializedViewWithCallback('admin bulk update');
        await invalidateMatchQueries();

        return true;
      } catch (err: any) {
        setError(err.message || 'Chyba při hromadné aktualizaci');
        console.error('Error bulk updating:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, invalidateMatchQueries]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createMatch,
    updateMatch,
    updateMatchResult,
    deleteMatch,
    deleteAllMatchesBySeason,
    bulkUpdateMatchweek,
    clearError,
  };
}
