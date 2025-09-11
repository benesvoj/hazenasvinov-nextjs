import {useState, useCallback, useRef} from 'react';
import {createClient} from '@/utils/supabase/client';

export function useTeamDisplayLogic(categoryId: string | null) {
  const [teamCounts, setTeamCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const lastCategoryId = useRef<string | null>(null);

  // Fetch team counts for a category
  const fetchTeamCounts = useCallback(async () => {
    if (!categoryId || categoryId === lastCategoryId.current) return;

    lastCategoryId.current = categoryId;
    setLoading(true);
    try {
      const supabase = createClient();
      const {data, error} = await supabase
        .from('club_categories')
        .select(
          `
          club_id,
          club_category_teams(id)
        `
        )
        .eq('category_id', categoryId)
        .eq('is_active', true);

      if (error) throw error;

      const counts = new Map<string, number>();
      data?.forEach((cc: any) => {
        counts.set(cc.club_id, cc.club_category_teams?.length || 0);
      });

      setTeamCounts(counts);
    } catch (error) {
      console.error('Error fetching team counts:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  // Generate display name with smart suffix logic
  const getDisplayName = useCallback(
    (team: any) => {
      if (!team?.club_category?.club) return 'Neznámý tým';

      const clubName = team.club_category.club.name;
      const teamSuffix = team.team_suffix || 'A';
      const clubId = team.club_category.club.id;
      const teamCount = teamCounts.get(clubId) || 0;

      // Only show suffix if club has multiple teams in this category
      return teamCount > 1 ? `${clubName} ${teamSuffix}` : clubName;
    },
    [teamCounts]
  );

  return {
    teamCounts,
    loading,
    fetchTeamCounts,
    getDisplayName,
  };
}
