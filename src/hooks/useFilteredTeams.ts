import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FilteredTeam } from '@/types';
import { getTeamDisplayNameSafe } from '@/utils/teamDisplay';

/**
 * Hook for fetching and filtering teams for a specific category and season
 * 
 * @returns {Object} Object containing:
 *   - filteredTeams: Array of teams filtered by category and season
 *   - loading: Loading state
 *   - error: Error state
 *   - fetchFilteredTeams: Function to fetch teams for a category/season
 *   - clearTeams: Function to clear teams and reset state
 * 
 * @example
 * ```tsx
 * const { filteredTeams, loading, error, fetchFilteredTeams, clearTeams } = useFilteredTeams();
 * 
 * useEffect(() => {
 *   if (categoryId && seasonId) {
 *     fetchFilteredTeams(categoryId, seasonId);
 *   }
 * }, [categoryId, seasonId, fetchFilteredTeams]);
 * 
 * return (
 *   <Select>
 *     {filteredTeams.map(team => (
 *       <SelectItem key={team.id}>{team.display_name}</SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function useFilteredTeams() {
  const [filteredTeams, setFilteredTeams] = useState<FilteredTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilteredTeams = useCallback(async (categoryId: string, seasonId: string) => {
    if (!categoryId || !seasonId) {
      setFilteredTeams([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching teams for category:', categoryId, 'season:', seasonId);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('club_categories')
        .select(`
          club_id,
          club:clubs(
            id,
            name,
            short_name,
            logo_url,
            venue
          ),
          club_category_teams(
            id,
            team_suffix,
            is_active
          )
        `)
        .eq('category_id', categoryId)
        .eq('season_id', seasonId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error fetching club categories:', error);
        setError('Chyba při načítání týmů');
        setFilteredTeams([]);
        return;
      }

      console.log('✅ Club categories data:', data);
      
      const teamsData = data?.flatMap((item: any) => {
        // Check if this club has multiple teams in this category
        const teamCount = item.club_category_teams?.length || 0;
        
        return item.club_category_teams?.map((ct: any) => {
          // Use the utility function for consistent team name logic
          const displayName = getTeamDisplayNameSafe(
            item.club.name, 
            ct.team_suffix, 
            teamCount, 
            "Neznámý tým"
          );
          
          return {
            id: ct.id,
            name: displayName,
            club_id: item.club.id,
            club_name: item.club.name,
            team_suffix: ct.team_suffix,
            display_name: displayName,
            is_active: ct.is_active,
            venue: item.club.venue
          };
        }) || [];
      }) || [];

      console.log('🔄 Transformed teams data:', teamsData);
      setFilteredTeams(teamsData);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching filtered teams:', error);
      setError('Chyba při načítání týmů');
      setFilteredTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTeams = useCallback(() => {
    setFilteredTeams([]);
    setError(null);
  }, []);

  return {
    filteredTeams,
    loading,
    error,
    fetchFilteredTeams,
    clearTeams
  };
}
