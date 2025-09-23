import {useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';
import {generateLineupId} from '@/utils/uuid';
import {LineupFormData} from '@/types';

/**
 * Hook for managing lineup-related Supabase operations
 * Extracted from LineupManager component to separate business logic
 */
export function useLineupManager() {
  const supabase = createClient();

  /**
   * Find existing lineup ID for a match and team
   */
  const findLineupId = useCallback(
    async (matchId: string, teamId: string): Promise<string | null> => {
      const {data: existingLineup, error: fetchError} = await supabase
        .from('lineups')
        .select('id')
        .eq('match_id', matchId)
        .eq('team_id', teamId)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Chyba při hledání sestavy: ${fetchError.message || 'Neznámá chyba'}`);
      }

      return existingLineup?.id || null;
    },
    [supabase]
  );

  /**
   * Generate lineup ID for a match and team
   */
  const generateLineupIdForTeam = useCallback(
    (matchId: string, teamId: string, isHome: boolean): string => {
      return generateLineupId(matchId, teamId, isHome);
    },
    []
  );

  /**
   * Check if lineup exists for a match and team
   */
  const checkLineupExists = useCallback(
    async (matchId: string, teamId: string): Promise<boolean> => {
      const lineupId = await findLineupId(matchId, teamId);
      return lineupId !== null;
    },
    [findLineupId]
  );

  /**
   * Get lineup ID, creating one if it doesn't exist
   */
  const getOrCreateLineupId = useCallback(
    async (matchId: string, teamId: string, isHome: boolean): Promise<string> => {
      const existingId = await findLineupId(matchId, teamId);
      return existingId || generateLineupIdForTeam(matchId, teamId, isHome);
    },
    [findLineupId, generateLineupIdForTeam]
  );

  return {
    findLineupId,
    generateLineupIdForTeam,
    checkLineupExists,
    getOrCreateLineupId,
  };
}
