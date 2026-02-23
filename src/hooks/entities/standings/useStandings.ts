'use client';

import {useCallback, useState} from 'react';

import {useSupabaseClient} from '@/hooks';
import {EnhancedStanding} from '@/types';

/**
 * Hook for fetching standings for a specific category and season
 *
 * @returns {Object} Object containing:
 *   - standings: Array of enhanced standings with team and club information
 *   - loading: Loading state
 *   - error: Error state
 *   - fetchStandings: Function to fetch standings for a category/season
 *   - clearStandings: Function to clear standings and reset state
 *
 * @example
 * ```tsx
 * const { standings, loading, error, fetchStandings, clearStandings } = useStandings();
 *
 * useEffect(() => {
 *   if (categoryId && seasonId) {
 *     fetchStandings(categoryId, seasonId);
 *   }
 * }, [categoryId, seasonId, fetchStandings]);
 *
 * return (
 *   <div>
 *     {loading && <div>Loading standings...</div>}
 *     {error && <div>Error: {error}</div>}
 *     {standings.map(standing => (
 *       <div key={standing.id}>
 *         {standing.position}. {standing.team?.club_name || 'Unknown'}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useStandings() {
  const [standings, setStandings] = useState<EnhancedStanding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabaseClient();

  const fetchStandings = useCallback(async (categoryId?: string, seasonId?: string) => {
    try {
      setLoading(true);
      setError(null);
      setStandings([]); // Clear previous standings when fetching new ones

      let query = supabase
        .from('standings')
        .select(
          `
          *,
          team:club_category_teams(
            id,
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name, logo_url)
            )
          )
        `
        )
        .order('position');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }

      const {data, error} = await query;

      if (error) {
        console.error('❌ Error fetching standings:', error);
        throw error;
      }

      // Enhance standings with club information
      const enhancedStandings = (data || []).map((standing: any) => {
        const team = standing.team;

        return {
          ...standing,
          team: team
            ? {
                ...team,
                team_suffix: team.team_suffix || 'A',
                club_name: team.club_category?.club?.name || 'Neznámý klub',
                club_id: team.club_category?.club?.id || null,
              }
            : null,
          // Add club information for backward compatibility
          club: team?.club_category?.club
            ? {
                id: team.club_category.club.id,
                name: team.club_category.club.name,
                short_name: team.club_category.club.short_name,
                logo_url: team.club_category.club.logo_url,
              }
            : null,
        };
      });

      setStandings(enhancedStandings);
      setError(null);
    } catch (error) {
      setError('Chyba při načítání tabulky');
      console.error('Error fetching standings:', error);
      setStandings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearStandings = useCallback(() => {
    setStandings([]);
    setError(null);
  }, []);

  return {
    standings,
    loading,
    error,
    fetchStandings,
    clearStandings,
  };
}
