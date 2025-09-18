import {useState, useEffect, useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';

interface UseTeamClubResult {
  clubId: string | null;
  isOwnClub: boolean | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get club_id and is_own_club status from team_id
 * @param teamId - The ID of the team
 * @returns Object containing clubId, isOwnClub status, loading state, and error state
 */
export function useTeamClub(teamId: string | null): UseTeamClubResult {
  const [clubId, setClubId] = useState<string | null>(null);
  const [isOwnClub, setIsOwnClub] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamClubInfo = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const {data, error: queryError} = await supabase
        .from('club_category_teams')
        .select(
          `
          club_category:club_categories(
            club_id,
            club:clubs(
              is_own_club
            )
          )
        `
        )
        .eq('id', id)
        .single();

      if (queryError) {
        throw queryError;
      }

      const clubId = data?.club_category?.club_id || null;
      const isOwnClub = data?.club_category?.club?.is_own_club || false;

      setClubId(clubId);
      setIsOwnClub(isOwnClub);
    } catch (err) {
      console.error('Error fetching team club info:', err);
      setError(err instanceof Error ? err.message : 'Chyba při načítání informací o klubu týmu');
      setClubId(null);
      setIsOwnClub(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!teamId) {
      setClubId(null);
      setIsOwnClub(null);
      setLoading(false);
      setError(null);
      return;
    }

    fetchTeamClubInfo(teamId);
  }, [teamId, fetchTeamClubInfo]);

  return {
    clubId,
    isOwnClub,
    loading,
    error,
  };
}
