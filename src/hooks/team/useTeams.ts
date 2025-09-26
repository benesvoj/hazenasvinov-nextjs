import {useState, useEffect, useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';
import {ClubCategoryTeams} from '@/types/clubs';

interface Team {
  id: string;
  name: string;
  short_name?: string;
  club_id: string;
  club_name: string;
  club_short_name?: string;
  team_suffix: string;
  category_id: string;
  category_name: string;
  season_id: string;
  season_name: string;
  is_active?: boolean;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {data, error} = await supabase
        .from('club_category_teams')
        .select(
          `
          id,
          team_suffix,
          is_active,
          club_category:club_categories!inner(
            club_id,
            club:clubs!inner(
              id,
              name,
              short_name
            ),
            category:categories!inner(
              id,
              name
            ),
            season:seasons!inner(
              id,
              name
            )
          )
        `
        )
        .eq('is_active', true)
        .order('team_suffix', {ascending: true});

      if (error) throw error;

      const transformedTeams: Team[] = (data || []).map((item: any) => ({
        id: item.id,
        name: `${item.club_category.club.name} ${item.team_suffix}`,
        short_name: item.club_category.club.short_name
          ? `${item.club_category.club.short_name} ${item.team_suffix}`
          : `${item.club_category.club.name} ${item.team_suffix}`,
        club_id: item.club_category.club_id,
        club_name: item.club_category.club.name,
        club_short_name: item.club_category.club.short_name,
        team_suffix: item.team_suffix,
        category_id: item.club_category.category.id,
        category_name: item.club_category.category.name,
        season_id: item.club_category.season.id,
        season_name: item.club_category.season.name,
        is_active: item.is_active,
      }));

      // Sort by club name, then by team suffix
      const sortedTeams = transformedTeams.sort((a, b) => {
        const clubNameComparison = a.club_name.localeCompare(b.club_name);
        if (clubNameComparison !== 0) return clubNameComparison;
        return a.team_suffix.localeCompare(b.team_suffix);
      });

      setTeams(sortedTeams);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
    fetchTeams, // Legacy compatibility
  };
}
