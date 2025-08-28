import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Match } from '@/types';
import { translations } from '@/lib/translations';
import { getTeamDisplayNameSafe } from '@/utils/teamDisplay';

export interface SeasonalMatches {
  autumn: Match[];
  spring: Match[];
}

export interface UseFetchMatchesOptions {
  /**
   * Whether to filter matches to only show those where the user's club is playing
   * - `true` (default): Show only own club matches (public pages)
   * - `false`: Show all matches (admin pages)
   */
  ownClubOnly?: boolean;
  
  /**
   * Whether to include detailed team information
   * - `true` (default): Include team names, logos, club info
   * - `false`: Basic team info only
   */
  includeTeamDetails?: boolean;
  
  /**
   * Whether to include standings data
   * - `false` (default): No standings data
   * - `true`: Include standings (future feature)
   */
  includeStandings?: boolean;
}

/**
 * Hook to fetch matches for a specific category and season
 * 
 * @param categorySlug - The category code (e.g., 'men', 'women')
 * @param seasonId - Optional season ID. If not provided, uses active season
 * @param options - Configuration options for filtering and data inclusion
 * 
 * @example
 * // Public page - show only own club matches for active season
 * const { matches, loading, error } = useFetchMatches('men');
 * 
 * // Admin page - show all matches for specific season
 * const { matches, loading, error } = useFetchMatches('men', 'season-id', { ownClubOnly: false });
 * 
 * // Custom filtering
 * const { matches, loading, error } = useFetchMatches('men', 'season-id', { 
 *   ownClubOnly: true,
 *   includeTeamDetails: true 
 * });
 */
export function useFetchMatches(
  categorySlug: string, 
  seasonId?: string, 
  options: UseFetchMatchesOptions = {}
) {
  const { 
    ownClubOnly = true, // Default to own club only for backward compatibility
    includeTeamDetails = true,
    includeStandings = false 
  } = options;

  const [matches, setMatches] = useState<SeasonalMatches>({ autumn: [], spring: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!categorySlug) {
        setLoading(false);
        setError(null);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        
        // First, get the category ID
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, code, name')
          .eq('code', categorySlug)
          .single();
        
        if (categoryError) {
          throw new Error(`Category not found: ${categoryError.message}`);
        }
        
        // Second, get the season ID (either provided or active season)
        let seasonData;
        if (seasonId) {
          seasonData = { id: seasonId };
        } else {
          // Get active season
          const { data: activeSeason, error: seasonError } = await supabase
            .from('seasons')
            .select('id, name, is_active')
            .eq('is_active', true)
            .single();
          
          if (seasonError) {
            throw new Error(`Active season not found: ${seasonError.message}`);
          }
          
          seasonData = activeSeason;
        }
        
        // Third, fetch matches with basic team IDs first
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
            home_team_id,
            away_team_id
          `)
          .eq('category_id', categoryData.id)
          .eq('season_id', seasonData.id)
          .order('date', { ascending: true });
        
        if (matchesError) {
          throw new Error(`Failed to fetch matches: ${matchesError.message}`);
        }
        
        // Fourth, fetch team details from club_category_teams table
        const teamIds = new Set<string>();
        matchesData?.forEach((match: any) => {
          if (match.home_team_id) teamIds.add(match.home_team_id);
          if (match.away_team_id) teamIds.add(match.away_team_id);
        });
        
        // Fetch team details with club information
        const { data: teamDetails, error: teamError } = await supabase
          .from('club_category_teams')
          .select(`
            id,
            team_suffix,
            club_category:club_categories(
              club:clubs(
                id,
                name,
                short_name,
                logo_url,
                is_own_club
              )
            )
          `)
          .in('id', Array.from(teamIds));
        
        if (teamError) {
          throw new Error(`Failed to fetch team details: ${teamError.message}`);
        }
        
        // Create a map for quick team lookup
        const teamMap = new Map();
        teamDetails?.forEach((team: any) => {
          teamMap.set(team.id, team);
        });
        
        // Transform matches to include team names and club information
        const transformedMatches = matchesData?.map((match: any) => {
          const homeTeamDetails = teamMap.get(match.home_team_id);
          const awayTeamDetails = teamMap.get(match.away_team_id);
          
          // Check if each team belongs to our club individually
          const homeTeamIsOwnClub = homeTeamDetails?.club_category?.club?.is_own_club === true;
          const awayTeamIsOwnClub = awayTeamDetails?.club_category?.club?.is_own_club === true;
          
          // Calculate team counts for smart suffix logic
          const homeClubId = homeTeamDetails?.club_category?.club?.id;
          const awayClubId = awayTeamDetails?.club_category?.club?.id;
          
          // Count teams per club in this category
          const clubTeamCounts = new Map<string, number>();
          teamDetails?.forEach((team: any) => {
            const clubId = team.club_category?.club?.id;
            if (clubId) {
              clubTeamCounts.set(clubId, (clubTeamCounts.get(clubId) || 0) + 1);
            }
          });
          
          // Use centralized team display utility with smart suffix logic
          const homeTeamName = getTeamDisplayNameSafe(
            homeTeamDetails?.club_category?.club?.name,
            homeTeamDetails?.team_suffix || 'A',
            clubTeamCounts.get(homeClubId || '') || 1,
            'Home team'
          );
          const awayTeamName = getTeamDisplayNameSafe(
            awayTeamDetails?.club_category?.club?.name,
            awayTeamDetails?.team_suffix || 'A',
            clubTeamCounts.get(awayClubId || '') || 1,
            'Away team'
          );
          
          return {
            ...match,
            home_team: {
              id: match.home_team_id,
              name: homeTeamName,
              short_name: homeTeamDetails?.club_category?.club?.short_name,
              is_own_club: homeTeamIsOwnClub,
              logo_url: homeTeamDetails.club_category.club?.logo_url
            },
            away_team: {
              id: match.away_team_id,
              name: awayTeamName,
              short_name: awayTeamDetails?.club_category?.club?.short_name,
              is_own_club: awayTeamIsOwnClub,
              logo_url: awayTeamDetails.club_category.club?.logo_url
            }
          };
        }) || [];
        
        // Apply filtering based on options
        let filteredMatches = transformedMatches;
        if (ownClubOnly) {
          // Filter matches to only show those where our club is playing
          filteredMatches = transformedMatches.filter((match: any) => 
            match.home_team?.is_own_club === true || match.away_team?.is_own_club === true
          );
        } else {
          // Show all matches (admin mode)
        }
        
        // Group matches by season (autumn/spring)
        const autumnMatches: Match[] = [];
        const springMatches: Match[] = [];
        
        filteredMatches.forEach((match: any) => {
          const matchDate = new Date(match.date);
          const month = matchDate.getMonth() + 1; // getMonth() returns 0-11
          
          if (month >= 8 || month <= 1) {
            // August to January = Autumn season
            autumnMatches.push(match);
          } else {
            // February to July = Spring season
            springMatches.push(match);
          }
        });
        
        // Sort matches within each season by date
        autumnMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        springMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setMatches({
          autumn: autumnMatches,
          spring: springMatches
        });
        
        setError(null);
        
        // Store debug info for troubleshooting
        setDebugInfo({
          categorySlug,
          categoryId: categoryData.id,
          seasonId: seasonData.id,
          totalMatches: filteredMatches.length,
          autumnCount: autumnMatches.length,
          springCount: springMatches.length,
          ownClubOnly,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Unknown error occurred'));
        setMatches({ autumn: [], spring: [] });
        setDebugInfo(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [categorySlug, seasonId, ownClubOnly, includeTeamDetails, includeStandings, refreshTrigger]);
  
  // Function to manually refresh matches
  const refreshMatches = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return {
    matches,
    loading,
    error,
    debugInfo,
    refreshMatches
  };
}
