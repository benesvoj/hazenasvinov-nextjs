import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Match } from '@/types';

/**
 * Hook to fetch all matches from the user's own club across all categories
 * This is a simplified approach that focuses on getting matches working
 * 
 * @returns {Object} Object containing:
 *   - matches: Array of all matches
 *   - loading: Loading state
 *   - error: Error state
 *   - debugInfo: Debug information for troubleshooting
 */
export function useOwnClubMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Fetch season data directly instead of depending on useSeasons
  const [activeSeason, setActiveSeason] = useState<any>(null);
  const [seasonError, setSeasonError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOwnClubMatches = async () => {
      // Fetch active season if we don't have it
      if (!activeSeason?.id) {
        console.log('⏳ [useOwnClubMatches] Fetching active season...');
        try {
          const supabase = createClient();
          const { data: seasonData, error: seasonErr } = await supabase
            .from('seasons')
            .select('id, name')
            .eq('is_active', true)
            .single();
          
          if (seasonErr) {
            console.error('❌ [useOwnClubMatches] Season error:', seasonErr);
            setSeasonError(new Error(`Active season not found: ${seasonErr.message}`));
            return;
          }
          
          console.log('✅ [useOwnClubMatches] Active season fetched:', seasonData.name);
          setActiveSeason(seasonData);
          
          // After setting season, fetch matches immediately
          await fetchMatches(seasonData);
          return;
        } catch (err) {
          console.error('❌ [useOwnClubMatches] Season fetch error:', err);
          setSeasonError(err instanceof Error ? err : new Error('Unknown season error'));
          return;
        }
      }
      
      // If we already have a season, fetch matches
      if (activeSeason?.id) {
        await fetchMatches(activeSeason);
      }
    };
    
    // Separate function to fetch matches
    const fetchMatches = async (season: any) => {
      console.log('🏆 [useOwnClubMatches] Fetching matches for season:', season.name);
      
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        
        // Fetch all matches for the season with team and category information
        const { data: matchesData, error: matchesError } = await supabase
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
              code,
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
          .eq('season_id', season.id)
          .order('date', { ascending: true });
        
        if (matchesError) {
          console.error('❌ [useOwnClubMatches] Matches error:', matchesError);
          throw new Error(`Failed to fetch matches: ${matchesError.message}`);
        }
        
        console.log('✅ [useOwnClubMatches] Total matches fetched:', matchesData?.length || 0);
        
        // Filter matches to only include those where our club is playing
        const ownClubMatches = matchesData?.filter((match: any) => {
          const homeTeamIsOwnClub = match.home_team?.club_category?.club?.is_own_club === true;
          const awayTeamIsOwnClub = match.away_team?.club_category?.club?.is_own_club === true;
          return homeTeamIsOwnClub || awayTeamIsOwnClub;
        }) || [];
        
        console.log('🏆 [useOwnClubMatches] Own club matches found:', ownClubMatches.length);
        
        // Transform matches to the expected format
        const transformedMatches = ownClubMatches.map((match: any) => {
          // Build team names using club name + team suffix
          const homeTeamName = match.home_team?.club_category?.club?.name 
            ? `${match.home_team.club_category.club.name} ${match.home_team.team_suffix || 'A'}`
            : 'Home team';
          const awayTeamName = match.away_team?.club_category?.club?.name 
            ? `${match.away_team.club_category.club.name} ${match.away_team.team_suffix || 'A'}`
            : 'Away team';
          
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
        
        console.log('✅ [useOwnClubMatches] Matches transformed:', transformedMatches.length);
        
        setMatches(transformedMatches);
        setError(null);
        
        // Store debug info
        setDebugInfo({
          activeSeason: season.name,
          seasonId: season.id,
          totalMatches: matchesData?.length || 0,
          ownClubMatches: ownClubMatches.length,
          transformedMatches: transformedMatches.length,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ [useOwnClubMatches] Error:', error);
        setError(error instanceof Error ? error : new Error('Unknown error occurred'));
        setMatches([]);
        setDebugInfo(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOwnClubMatches();
  }, []); // Only run once on mount - no dependencies to avoid infinite loops
  
  // If there's a season error, return it as the main error
  const finalError = seasonError || error;
  
  return {
    matches,
    loading,
    error: finalError,
    debugInfo
  };
}
