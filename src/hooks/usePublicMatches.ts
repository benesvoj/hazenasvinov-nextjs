import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Match } from '@/types/match';
import { transformMatchWithTeamNames } from '@/utils/teamDisplay';

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
      
      
      // Step 3: Fetch team details from club_category_teams table
      
      // Get unique team IDs to fetch details
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
      
      // Transform matches to include team names and club information using the centralized utility
      const transformedMatches = matchesData?.map((match: any) => {
        // Use centralized team display utility with smart suffix logic
        const transformedMatch = transformMatchWithTeamNames(match, [], {
          useTeamMap: true,
          teamMap,
          teamDetails
        });
        
        // Add the is_own_club flags that are specific to this hook
        const homeTeamDetails = teamMap.get(match.home_team_id);
        const awayTeamDetails = teamMap.get(match.away_team_id);
        const homeTeamIsOwnClub = homeTeamDetails?.club_category?.club?.is_own_club === true;
        const awayTeamIsOwnClub = awayTeamDetails?.club_category?.club?.is_own_club === true;
        
        return {
          ...transformedMatch,
          home_team: {
            ...transformedMatch.home_team,
            is_own_club: homeTeamIsOwnClub
          },
          away_team: {
            ...transformedMatch.away_team,
            is_own_club: awayTeamIsOwnClub
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
