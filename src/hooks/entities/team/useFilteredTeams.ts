'use client';
import {useState, useEffect, useCallback, useMemo} from 'react';

import {createClient} from '@/utils/supabase/client';

interface FilteredTeam {
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

interface UseFilteredTeamsOptions {
  categoryId?: string;
  seasonId?: string;
  clubId?: string;
  searchTerm?: string;
  isActive?: boolean;
}

export function useFilteredTeams(
  categoryIdOrOptions?: string | UseFilteredTeamsOptions,
  seasonId?: string
) {
  // Handle both string categoryId and options object
  const options: UseFilteredTeamsOptions = useMemo(
    () =>
      typeof categoryIdOrOptions === 'string'
        ? {categoryId: categoryIdOrOptions, seasonId}
        : categoryIdOrOptions || {},
    [categoryIdOrOptions, seasonId]
  );

  const [teams, setTeams] = useState<FilteredTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('club_category_teams').select(`
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
        `);

      // Apply filters
      if (options.categoryId) {
        query = query.eq('club_category.category_id', options.categoryId);
      }
      if (options.seasonId) {
        query = query.eq('club_category.season_id', options.seasonId);
      }
      if (options.clubId) {
        query = query.eq('club_category.club_id', options.clubId);
      }
      if (options.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
      }

      const {data, error} = await query.order('team_suffix', {ascending: true});

      if (error) throw error;

      const transformedTeams: FilteredTeam[] = (data || []).map((item: any) => ({
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
  }, [supabase, options.categoryId, options.seasonId, options.clubId, options.isActive]);

  // Filter by search term
  const filteredTeams = useMemo(() => {
    if (!options.searchTerm) return teams;

    const searchLower = options.searchTerm.toLowerCase();
    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(searchLower) ||
        team.club_name.toLowerCase().includes(searchLower) ||
        team.category_name.toLowerCase().includes(searchLower)
    );
  }, [teams, options.searchTerm]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const clearTeams = useCallback(() => {
    setTeams([]);
  }, []);

  return {
    teams: filteredTeams,
    loading,
    error,
    refetch: fetchTeams,
    // Legacy compatibility
    filteredTeams,
    fetchFilteredTeams: useCallback(
      (categoryId?: string, seasonId?: string) => {
        // This is a legacy function that doesn't actually change the options
        // It just triggers a refetch with current options
        return fetchTeams();
      },
      [fetchTeams]
    ),
    clearTeams,
  };
}
