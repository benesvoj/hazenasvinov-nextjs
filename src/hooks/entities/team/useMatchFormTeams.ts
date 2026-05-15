'use client';

import {useCallback, useEffect, useState} from 'react';

import {useSupabaseClient} from '@/hooks';

export interface MatchFormTeam {
  id: string;
  name: string;
  short_name: string;
  club_id: string;
}

export function useMatchFormTeams(categoryId: string | undefined, seasonId: string | undefined) {
  const [teams, setTeams] = useState<MatchFormTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = useSupabaseClient();

  const fetchTeams = useCallback(async () => {
    if (!categoryId || !seasonId) {
      setTeams([]);
      return;
    }

    setLoading(true);
    try {
      const {data, error} = await supabase
        .from('club_categories')
        .select(
          `
          club_id,
          clubs!inner(name, short_name),
          club_category_teams(id, team_suffix)
        `
        )
        .eq('category_id', categoryId)
        .eq('season_id', seasonId);

      if (error) throw error;

      const result: MatchFormTeam[] = [];

      for (const clubCategory of data || []) {
        const club = clubCategory.clubs as any;
        const teamEntries = (clubCategory.club_category_teams as any[]) || [];
        const hasMultipleTeams = teamEntries.length > 1;

        for (const team of teamEntries) {
          result.push({
            id: team.id,
            name: hasMultipleTeams ? `${club.name} ${team.team_suffix}` : club.name,
            short_name: hasMultipleTeams
              ? `${club.short_name || club.name} ${team.team_suffix}`
              : club.short_name || club.name,
            club_id: clubCategory.club_id,
          });
        }
      }

      result.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
      setTeams(result);
    } catch (err) {
      console.error('useMatchFormTeams fetch error:', err);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, categoryId, seasonId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {teams, loading};
}
