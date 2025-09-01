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
      
      // Step 1: Get category data (if specified)
      let categoryFilter = '';
      if (categorySlug && categorySlug !== 'all') {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, code, name')
          .eq('code', categorySlug)
          .single();
        
        if (categoryError) {
          throw new Error(`Category not found: ${categoryError.message}`);
        }
        
        categoryFilter = categoryData.id;
      }
      
      // Step 2: Build the matches query - only fetch basic match data
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
      }
      
      // Don't filter by season for public matches - show all available
      
      const { data: matchesData, error: matchesError } = await query
        .order('date', { ascending: true });
      
      if (matchesError) {
        throw new Error(`Failed to fetch matches: ${matchesError.message}`);
      }
      
      
      // Step 3: Use the new team_suffix_helper view for perfect suffix logic
      
      // Get unique team IDs to fetch details
      const teamIds = new Set<string>();
      matchesData?.forEach((match: any) => {
        if (match.home_team_id) teamIds.add(match.home_team_id);
        if (match.away_team_id) teamIds.add(match.away_team_id);
      });
      
      // Fetch team details using the new view - this gives us perfect suffix logic
      const { data: teamDetails, error: teamError } = await supabase
        .from('team_suffix_helper')
        .select('*')
        .in('team_id', Array.from(teamIds));
      
      if (teamError) {  
        throw new Error(`Failed to fetch team details: ${teamError.message}`);
      }
      
      // Create a map for quick team lookup
      const teamMap = new Map();
      teamDetails?.forEach((team: any) => {
        teamMap.set(team.team_id, team);
      });
      
      // Transform matches to include team names and club information
      const transformedMatches = matchesData?.map((match: any) => {
        // Get team details from the view
        const homeTeamDetails = teamMap.get(match.home_team_id);
        const awayTeamDetails = teamMap.get(match.away_team_id);
        
        // Build team names with perfect suffix logic using the view data
        const homeTeamName = homeTeamDetails?.team_count_in_category > 1 
          ? `${homeTeamDetails.club_name} ${homeTeamDetails.team_suffix}`
          : homeTeamDetails?.club_name || 'Unknown Team';
          
        const awayTeamName = awayTeamDetails?.team_count_in_category > 1 
          ? `${awayTeamDetails.club_name} ${awayTeamDetails.team_suffix}`
          : awayTeamDetails?.club_name || 'Unknown Team';
        
        // Add the is_own_club flags that are specific to this hook
        const homeTeamIsOwnClub = homeTeamDetails?.is_own_club === true;
        const awayTeamIsOwnClub = awayTeamDetails?.is_own_club === true;
        
        return {
          ...match,
          home_team: {
            id: match.home_team_id,
            name: homeTeamName,
            short_name: homeTeamDetails?.club_short_name,
            is_own_club: homeTeamIsOwnClub,
            logo_url: homeTeamDetails?.club_logo_url
          },
          away_team: {
            id: match.away_team_id,
            name: awayTeamName,
            short_name: awayTeamDetails?.club_short_name,
            is_own_club: awayTeamIsOwnClub,
            logo_url: awayTeamDetails?.club_logo_url
          }
        };
      }) || [];
      
      // Group matches by season (autumn/spring)
      const autumnMatches: Match[] = [];
      const springMatches: Match[] = [];
      
      transformedMatches.forEach((match: any) => {
        const matchDate = new Date(match.date);
        const month = matchDate.getMonth() + 1; // getMonth() returns 0-11
        
        if (month >= 8 || month <= 1) {
          // August to January = Autumn season
          autumnMatches.push(match as Match);
        } else {
          // February to July = Spring season
          springMatches.push(match as Match);
        }
      });
      
      // Sort matches within each season by date
      autumnMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      springMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
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
