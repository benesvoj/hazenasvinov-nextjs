import {useState, useEffect, useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';

interface TeamClub {
  team_id: string;
  club_id: string;
  club_name: string;
  club_short_name?: string;
  team_suffix: string;
  is_primary?: boolean;
}

interface UseTeamClubOptions {
  teamId?: string;
  clubId?: string;
  categoryId?: string;
  seasonId?: string;
}

export function useTeamClub(teamIdOrOptions?: string | UseTeamClubOptions) {
  // Handle both string teamId and options object
  const options: UseTeamClubOptions =
    typeof teamIdOrOptions === 'string' ? {teamId: teamIdOrOptions} : teamIdOrOptions || {};
  const [teamClub, setTeamClub] = useState<TeamClub | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTeamClub = useCallback(async () => {
    if (!options.teamId && !options.clubId) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('club_category_teams').select(`
          id,
          team_suffix,
          is_primary,
          club_category:club_categories!inner(
            club_id,
            club:clubs!inner(
              id,
              name,
              short_name
            )
          )
        `);

      if (options.teamId) {
        query = query.eq('id', options.teamId);
      }
      if (options.clubId) {
        query = query.eq('club_category.club_id', options.clubId);
      }
      if (options.categoryId) {
        query = query.eq('club_category.category_id', options.categoryId);
      }
      if (options.seasonId) {
        query = query.eq('club_category.season_id', options.seasonId);
      }

      const {data, error} = await query.single();

      if (error) throw error;

      if (data) {
        const teamClubData: TeamClub = {
          team_id: data.id,
          club_id: data.club_category.club_id,
          club_name: data.club_category.club.name,
          club_short_name: data.club_category.club.short_name,
          team_suffix: data.team_suffix,
          is_primary: data.is_primary,
        };
        setTeamClub(teamClubData);
      } else {
        setTeamClub(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team club');
      setTeamClub(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, options.teamId, options.clubId, options.categoryId, options.seasonId]);

  useEffect(() => {
    fetchTeamClub();
  }, [fetchTeamClub]);

  return {
    teamClub,
    loading,
    error,
    refetch: fetchTeamClub,
    // Legacy compatibility
    clubId: teamClub?.club_id,
    isOwnClub: teamClub?.club_id ? false : false, // This would need to be determined based on your own club logic
  };
}
