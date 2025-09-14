import {useState, useEffect} from 'react';
import {useSeasons} from '@/hooks';
import {createClient} from '@/utils/supabase/client';

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

        // First get all active categories
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

        // Then get matches for all categories
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
          .limit(10);

        if (fetchError) {
          throw fetchError;
        }

        setMatches(data || []);
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
