import {useState, useEffect} from 'react';

import {createClient} from '@/utils/supabase/client';
import {transformMatchWithTeamNames} from '@/utils/teamDisplay';

import {useSeasons} from '@/hooks';

export function useAllCategoriesMatches() {
  const {activeSeason} = useSeasons();
  // TODO: Add type for matches
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAllMatches = async () => {
      if (!activeSeason?.id) {
        setMatches([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // First get all active category
        const {data: categories, error: categoriesError} = await supabase
          .from('categories')
          .select('id')
          .eq('is_active', true);

        if (categoriesError) {
          throw categoriesError;
        }

        if (!categories || categories.length === 0) {
          setMatches([]);
          setLoading(false);
          return;
        }

        const categoryIds = categories.map((cat: {id: string}) => cat.id);

        // Then get matches for all category
        const {data, error: fetchError} = await supabase
          .from('matches')
          .select(
            `
            *,
            home_team:home_team_id(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(id, name, short_name, logo_url, is_own_club)
              )
            ),
            away_team:away_team_id(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(id, name, short_name, logo_url, is_own_club)
              )
            ),
            category:category_id(id, name)
          `
          )
          .in('category_id', categoryIds)
          .eq('season_id', activeSeason.id)
          .eq('status', 'completed')
          .order('date', {ascending: false})
          .limit(50); // Get more matches to filter from

        if (fetchError) {
          throw fetchError;
        }

        // Filter for own club matches and limit to 10
        const ownClubMatches = (data || [])
          .filter(
            (match: any) =>
              match.home_team?.club_category?.club?.is_own_club === true ||
              match.away_team?.club_category?.club?.is_own_club === true
          )
          .slice(0, 10);

        // Calculate team counts for proper suffix display
        const clubTeamCounts = new Map<string, number>();
        ownClubMatches.forEach((match: any) => {
          const homeClubId = match.home_team?.club_category?.club?.id;
          const awayClubId = match.away_team?.club_category?.club?.id;

          if (homeClubId) {
            clubTeamCounts.set(homeClubId, (clubTeamCounts.get(homeClubId) || 0) + 1);
          }
          if (awayClubId) {
            clubTeamCounts.set(awayClubId, (clubTeamCounts.get(awayClubId) || 0) + 1);
          }
        });

        // Transform matches with proper team names and suffixes
        const transformedMatches = ownClubMatches.map((match: any) =>
          transformMatchWithTeamNames(match, ownClubMatches, {
            useTeamMap: false,
            teamDetails: ownClubMatches,
            clubTeamCounts,
          })
        );

        setMatches(transformedMatches);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch matches'));
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMatches();
  }, [activeSeason?.id]);

  return {matches, loading, error};
}
