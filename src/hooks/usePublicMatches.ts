import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Match } from '@/types/match';

interface PublicMatchesResult {
  matches: {
    autumn: Match[];
    spring: Match[];
  };
  loading: boolean;
  error: string | null;
  debugInfo?: any;
}

export function usePublicMatches(categorySlug?: string): PublicMatchesResult {
  const [matches, setMatches] = useState<{ autumn: Match[]; spring: Match[] }>({
    autumn: [],
    spring: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      
      console.log('🔍 [usePublicMatches] Fetching matches for category:', categorySlug);
      
      // Step 1: Get category data (if specified)
      let categoryFilter = '';
      if (categorySlug && categorySlug !== 'all') {
        console.log('📋 Step 1: Fetching category data for:', categorySlug);
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, code, name')
          .eq('code', categorySlug)
          .single();
        
        if (categoryError) {
          console.error('❌ Category error:', categoryError);
          throw new Error(`Category not found: ${categoryError.message}`);
        }
        
        console.log('✅ Category found:', categoryData);
        categoryFilter = categoryData.id;
      }
      
      // Step 2: Build the matches query - only fetch basic match data
      console.log('🏆 Step 2: Building matches query...');
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
          home_team_id,
          away_team_id
        `);
      
      // Apply category filter if specified
      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
        console.log('🔍 Filtering by category_id:', categoryFilter);
      }
      
      // Don't filter by season for public matches - show all available
      console.log('🔍 No season filter applied - showing all available matches');
      
      const { data: matchesData, error: matchesError } = await query
        .order('date', { ascending: true });
      
      if (matchesError) {
        console.error('❌ Matches fetch error:', matchesError);
        throw new Error(`Failed to fetch matches: ${matchesError.message}`);
      }
      
      console.log('✅ Matches fetched:', matchesData?.length || 0, 'matches');
      if (matchesData && matchesData.length > 0) {
        console.log('🔍 Sample match data:', matchesData[0]);
      }
      
      // Step 3: Fetch team details from club_category_teams table
      console.log('🏆 Step 3: Fetching team details...');
      
      // Get unique team IDs to fetch details
      const teamIds = new Set<string>();
      matchesData?.forEach((match: any) => {
        if (match.home_team_id) teamIds.add(match.home_team_id);
        if (match.away_team_id) teamIds.add(match.away_team_id);
      });
      
      console.log('🔍 Unique team IDs found:', Array.from(teamIds));
      
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
        console.error('❌ Team details fetch error:', teamError);
        throw new Error(`Failed to fetch team details: ${teamError.message}`);
      }
      
      console.log('✅ Team details fetched:', teamDetails?.length || 0, 'teams');
      
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
        
        // Build team names using club name + team suffix
        const homeTeamName = homeTeamDetails?.club_category?.club?.name 
          ? `${homeTeamDetails.club_category.club.name} ${homeTeamDetails.team_suffix || 'A'}`
          : 'Home team';
        const awayTeamName = awayTeamDetails?.club_category?.club?.name 
          ? `${awayTeamDetails.club_category.club.name} ${awayTeamDetails.team_suffix || 'A'}`
          : 'Away team';
        
        return {
          ...match,
          home_team: {
            id: match.home_team_id,
            name: homeTeamName,
            short_name: homeTeamDetails?.club_category?.club?.short_name,
            is_own_club: homeTeamIsOwnClub,
            logo_url: homeTeamDetails?.club_category?.club?.logo_url
          },
          away_team: {
            id: match.away_team_id,
            name: awayTeamName,
            short_name: awayTeamDetails?.club_category?.club?.short_name,
            is_own_club: awayTeamIsOwnClub,
            logo_url: awayTeamDetails?.club_category?.club?.logo_url
          }
        };
      }) || [];
      
      // Group matches by season (autumn/spring)
      const autumnMatches: Match[] = [];
      const springMatches: Match[] = [];
      
      transformedMatches.forEach((match: any) => {
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
      
      console.log('🍂 Autumn matches:', autumnMatches.length);
      console.log('🌸 Spring matches:', springMatches.length);
      
      setMatches({
        autumn: autumnMatches,
        spring: springMatches
      });
      
      setDebugInfo({
        category: categorySlug,
        totalMatches: matchesData?.length || 0,
        filteredMatches: transformedMatches.length,
        autumnCount: autumnMatches.length,
        springCount: springMatches.length,
      });
      
    } catch (error) {
      console.error('❌ [usePublicMatches] Error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [categorySlug]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    loading,
    error,
    debugInfo
  };
}
