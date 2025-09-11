import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Match } from '@/types';
import { getTeamDisplayNameSafe } from '@/utils/teamDisplay';

/**
 * Hook to fetch matches from the user's own club
 * 
 * @param categoryId - Optional category ID to filter matches by specific category
 * @returns {Object} Object containing:
 *   - matches: Array of matches (filtered by category if provided)
 *   - loading: Loading state
 *   - error: Error state
 *   - debugInfo: Debug information for troubleshooting
 */
export function useOwnClubMatches(categoryId?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Fetch season data directly instead of depending on useSeasons
  const [activeSeason, setActiveSeason] = useState<any>(null);
  const [seasonError, setSeasonError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOwnClubMatches = async () => {
      // Don't fetch matches if we don't have a category ID
      if (!categoryId) {
        setMatches([]);
        setLoading(false);
        return;
      }
      
      // Don't fetch matches if we don't have an active season
      if (!activeSeason?.id) {
        setMatches([]);
        setLoading(false);
        return;
      }
      
      // If we have both category ID and active season, fetch matches
      await fetchMatches(activeSeason);
    };
    
    // Separate function to fetch matches
    const fetchMatches = async (season: any) => {
      
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        
        // Build the query for matches
        let query = supabase
          .from('matches')
          .select(`
            id,
            date,
            time,
            venue,
            competition,
            status,
            home_score,
            away_score,
            matchweek,
            match_number,
            category_id,
            season_id,
            created_at,
            updated_at,
            category:categories(
              id,
              name,
              description
            ),
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
            )
          `)
          .eq('season_id', season.id);
        
        // Filter by category if provided
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }
        
        const { data: matchesData, error: matchesError } = await query.order('date', { ascending: true });
        
        if (matchesError) {
          throw new Error(`Failed to fetch matches: ${matchesError.message}`);
        }
        
        // Filter matches to only include those where our club is playing
        const ownClubMatches = matchesData?.filter((match: any) => {
          const homeTeamIsOwnClub = match.home_team?.club_category?.club?.is_own_club === true;
          const awayTeamIsOwnClub = match.away_team?.club_category?.club?.is_own_club === true;
          return homeTeamIsOwnClub || awayTeamIsOwnClub;
        }) || [];
        
        // To get accurate team counts per club in categories, we need standings data
        // This is the same approach used by the working standings tables
        const { data: standingsData, error: standingsError } = await supabase
          .from('standings')
          .select(`
            id,
            team_id,
            category_id,
            team:club_category_teams(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(id, name, short_name, logo_url)
              )
            )
          `)
          .eq('season_id', season.id);
        
        if (standingsError) {
          console.error('❌ [useOwnClubMatches] Standings error:', standingsError);
          // Continue without standings, but smart suffixes won't work properly
        }
        
        // Create club team counts map from standings (same logic as working solutions)
        const clubTeamCountsByCategory = new Map<string, Map<string, number>>();
        standingsData?.forEach((standing: any) => {
          const categoryId = standing.category_id;
          const clubId = standing.team?.club_category?.club?.id;
          
          if (!clubTeamCountsByCategory.has(categoryId)) {
            clubTeamCountsByCategory.set(categoryId, new Map<string, number>());
          }
          
          const categoryTeamCounts = clubTeamCountsByCategory.get(categoryId)!;
          
          if (clubId) {
            categoryTeamCounts.set(clubId, (categoryTeamCounts.get(clubId) || 0) + 1);
          }
        });
        

        
        // Transform matches to the expected format with smart suffix logic
        // Use the same approach as the working CategoryStandingsTable
        const transformedMatches = ownClubMatches.map((match: any) => {
          const categoryId = match.category_id;
          const categoryTeamCounts = clubTeamCountsByCategory.get(categoryId) || new Map<string, number>();
          
          // Use the same logic as the working standings tables
          const homeClubId = match.home_team?.club_category?.club?.id;
          const awayClubId = match.away_team?.club_category?.club?.id;
          
          const homeTeamName = getTeamDisplayNameSafe(
            match.home_team?.club_category?.club?.name,
            match.home_team?.team_suffix || 'A',
            categoryTeamCounts.get(homeClubId || '') || 1,
            'Home team'
          );
          const awayTeamName = getTeamDisplayNameSafe(
            match.away_team?.club_category?.club?.name,
            match.away_team?.team_suffix || 'A',
            categoryTeamCounts.get(awayClubId || '') || 1,
            'Away team'
          );
          
          return {
            ...match,
            home_team: {
              id: match.home_team?.id,
              name: homeTeamName,
              short_name: match.home_team?.club_category?.club?.short_name,
              is_own_club: match.home_team?.club_category?.club?.is_own_club === true,
              logo_url: match.home_team?.club_category?.club?.logo_url
            },
            away_team: {
              id: match.away_team?.id,
              name: awayTeamName,
              short_name: match.away_team?.club_category?.club?.short_name,
              is_own_club: match.away_team?.club_category?.club?.is_own_club === true,
              logo_url: match.away_team?.club_category?.club?.logo_url
            }
          };
        });
        
        setMatches(transformedMatches);
        setError(null);
    
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Unknown error occurred'));
        setMatches([]);
        setDebugInfo(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOwnClubMatches();
  }, [categoryId, activeSeason]); // Refetch when categoryId or activeSeason changes
  
  // Fetch active season on mount
  useEffect(() => {
    const fetchActiveSeason = async () => {
      try {
        const supabase = createClient();
        const { data: seasonData, error: seasonErr } = await supabase
          .from('seasons')
          .select('id, name')
          .eq('is_active', true)
          .single();
        
        if (seasonErr) {
          setSeasonError(new Error(`Active season not found: ${seasonErr.message}`));
          return;
      }
    
        setActiveSeason(seasonData);
      } catch (err) {
        setSeasonError(err instanceof Error ? err : new Error('Unknown season error'));
      }
    };
    
    fetchActiveSeason();
  }, []); // Only run on mount
  
  // If there's a season error, return it as the main error
  const finalError = seasonError || error;
  
  return {
    matches,
    loading,
    error: finalError,
    debugInfo
  };
}
