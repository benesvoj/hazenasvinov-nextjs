import {useState, useEffect, useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';

export function useTeamClubId(teamId?: string) {
  const [clubId, setClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchClubId = useCallback(async () => {
    if (!teamId) {
      setClubId(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Simple query to get club_id from team_id
      const {data, error: queryError} = await supabase
        .from('clubs')
        .select(
          `
          id,
          club_categories!inner(
            id,
            club_category_teams!inner(
              id
            )
          )
        `
        )
        .eq('club_categories.club_category_teams.id', teamId)
        .single();

      if (queryError) {
        throw queryError;
      }

      if (data) {
        setClubId(data.id);
      } else {
        setClubId(null);
      }
    } catch (err) {
      console.error('Error fetching club ID for team:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch club ID');
      setClubId(null);
    } finally {
      setLoading(false);
    }
  }, [teamId, supabase]);

  useEffect(() => {
    fetchClubId();
  }, [fetchClubId]);

  return {
    clubId,
    loading,
    error,
    refetch: fetchClubId,
  };
}
