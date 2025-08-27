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
        
        // console.log('🔍 Fetching matches for category:', categorySlug, 'season:', seasonId, 'ownClubOnly:', ownClubOnly);
        
        // First, get the category ID
        // console.log('📋 Step 1: Fetching category data...');
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, code, name')
          .eq('code', categorySlug)
          .single();
        
        if (categoryError) {
        //   console.error('❌ Category error:', categoryError);
          throw new Error(`Category not found: ${categoryError.message}`);
        }
        
        // console.log('✅ Category found:', categoryData);
        
        // Get the season (either provided seasonId or active season)
        let seasonData;
        if (seasonId) {
          // Use provided seasonId
          const { data, error: seasonError } = await supabase
            .from('seasons')
            .select('id, name')
            .eq('id', seasonId)
            .single();
          
          if (seasonError) {
            throw new Error(`Season not found: ${seasonError.message}`);
          }
          seasonData = data;
        } else {
          // Get the active season (backward compatibility)
          const { data, error: seasonError } = await supabase
            .from('seasons')
            .select('id, name')
            .eq('is_active', true)
            .single();
          
          if (seasonError) {
            throw new Error(`Active season not found: ${seasonError.message}`);
          }
          seasonData = data;
        }
        
        // console.log('✅ Season found:', seasonData);
        
        // Check if matches table exists by trying a simple query
        // console.log('⚽ Step 3: Checking matches table...');
        const { data: tableCheck, error: tableError } = await supabase
          .from('matches')
          .select('count')
          .limit(1);
        
        if (tableError) {
        //   console.error('❌ Matches table error:', tableError);
          if (tableError.code === '42P01') {
            throw new Error('Matches table does not exist. Please create it first.');
          }
          throw new Error(`Matches table error: ${tableError.message}`);
        }
        
        // console.log('✅ Matches table accessible');
        
        // Fetch matches for this category and season with team information
        // console.log('🏆 Step 4: Fetching matches with team data...');
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
          .eq('category_id', categoryData.id)
          .eq('season_id', seasonData.id)
          .order('date', { ascending: true });
        
        if (matchesError) {
        //   console.error('❌ Matches fetch error:', matchesError);
          throw new Error(`Failed to fetch matches: ${matchesError.message}`);
        }
        
        // console.log('✅ Matches fetched:', matchesData?.length || 0, 'matches');
        
        // Transform matches to include team names and club information
        // Use the same centralized logic that standings tables use
        const transformedMatches = matchesData?.map((match: any) => {
          // Check if each team belongs to our club individually
          const homeTeamIsOwnClub = match.home_team?.club_category?.club?.is_own_club === true;
          const awayTeamIsOwnClub = match.away_team?.club_category?.club?.is_own_club === true;
          
          // Use centralized team display logic for consistency
          const getTeamDisplayName = (team: any) => {
            if (!team?.club_category?.club) return translations.team.unknownTeam;
            
            const clubName = team.club_category.club.name;
            const teamSuffix = team.team_suffix || 'A';
            const clubId = team.club_category.club.id;
            
            // Calculate UNIQUE TEAMS per club in this category (not matches!)
            // This is the same logic used in standings tables
            const uniqueTeams = new Set();
            matchesData?.forEach((m: any) => {
              const homeClubId = m.home_team?.club_category?.club?.id;
              const awayClubId = m.away_team?.club_category?.club?.id;
              
              if (homeClubId === clubId) {
                // Add unique team ID for this club
                const homeTeamId = m.home_team?.id;
                if (homeTeamId) uniqueTeams.add(homeTeamId);
              }
              if (awayClubId === clubId) {
                // Add unique team ID for this club
                const awayTeamId = m.away_team?.id;
                if (awayTeamId) uniqueTeams.add(awayTeamId);
              }
            });
            
            const teamCount = uniqueTeams.size;
            
            // Debug: Log team count calculation for verification
            console.log(`🔍 Team display debug: ${clubName} - Team count: ${teamCount}, Will show suffix: ${teamCount > 1}`);
            
            // Use the centralized utility function for consistent logic
            return getTeamDisplayNameSafe(clubName, teamSuffix, teamCount, translations.team.unknownTeam);
          };
          
          const homeTeamName = getTeamDisplayName(match.home_team);
          const awayTeamName = getTeamDisplayName(match.away_team);
          
          return {
            ...match,
            home_team: {
              id: match.home_team?.id,
              name: homeTeamName,
              short_name: match.home_team?.club_category?.club?.short_name,
              is_own_club: homeTeamIsOwnClub,
              logo_url: match.home_team?.club_category?.club?.logo_url
            },
            away_team: {
              id: match.away_team?.id,
              name: awayTeamName,
              short_name: match.away_team?.club_category?.club?.short_name,
              is_own_club: awayTeamIsOwnClub,
              logo_url: match.away_team?.club_category?.club?.logo_url
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
          // console.log('🏆 Own club matches found:', filteredMatches.length);
        } else {
          // Show all matches (admin mode)
          // console.log('🏆 All matches found:', filteredMatches.length);
        }
        
        // Group matches by season (autumn/spring)
        const autumnMatches: Match[] = [];
        const springMatches: Match[] = [];
        
        filteredMatches.forEach((match: any) => {
          const matchDate = new Date(match.date);
          const month = matchDate.getMonth() + 1; // January is 0
          
          // Autumn: September (9), October (10), November (11)
          // Spring: March (3), April (4), May (5)
          if (month >= 8 || month <= 12) {
            autumnMatches.push(match as Match);
          } else if (month >= 3 && month <= 6) {
            springMatches.push(match as Match);
          }
        });
        
        // console.log('🍂 Autumn matches:', autumnMatches.length);
        // console.log('🌸 Spring matches:', springMatches.length);
        
        setMatches({
          autumn: autumnMatches,
          spring: springMatches
        });
        
        setDebugInfo({
          category: categoryData,
          season: seasonData,
          totalMatches: matchesData?.length || 0,
          filteredMatches: filteredMatches.length,
          ownClubOnly,
          autumnCount: autumnMatches.length,
          springCount: springMatches.length,
          seasonQuery: `Found season: ${seasonData.name} (ID: ${seasonData.id})`,
          filtering: ownClubOnly 
            ? `Filtered ${matchesData?.length || 0} total matches to ${filteredMatches.length} own club matches`
            : `Showing all ${filteredMatches.length} matches for category`
        });
        
      } catch (err) {
        // console.error('💥 Failed to fetch matches:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(new Error(errorMessage));
        setDebugInfo({ error: errorMessage, categorySlug, seasonId, ownClubOnly });
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [categorySlug, seasonId, ownClubOnly]);

  return { matches, loading, error, debugInfo };
}
