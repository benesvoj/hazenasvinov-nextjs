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

export function usePublicMatches(categoryId?: string): PublicMatchesResult {
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

      if (categoryId && categoryId !== 'all') {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, slug, name')
          .eq('id', categoryId)
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
      
      
      // Step 3: Fetch team details and club categories for suffix logic
      
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
            id,
            max_teams,
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
      
      // Get club categories to determine which clubs need suffixes per category (max_teams > 1)
      const { data: clubCategoriesData, error: clubCategoriesError } = await supabase
        .from('club_categories')
        .select(`
          id,
          category_id,
          max_teams,
          club:clubs(
            id,
            name,
            short_name,
            logo_url,
            is_own_club
          )
        `)
        .eq('is_active', true);
      
      if (clubCategoriesError) {
        throw new Error(`Failed to fetch club categories: ${clubCategoriesError.message}`);
      }
      
      // Build map of clubs that need suffixes per category
      const clubsNeedingSuffixesPerCategory = new Map<string, Set<string>>();
      if (clubCategoriesData) {
        clubCategoriesData.forEach((clubCategory: any) => {
          const club = clubCategory.club;
          if (club && club.name && clubCategory.max_teams > 1) {
            const categoryId = clubCategory.category_id;
            if (!clubsNeedingSuffixesPerCategory.has(categoryId)) {
              clubsNeedingSuffixesPerCategory.set(categoryId, new Set());
            }
            clubsNeedingSuffixesPerCategory.get(categoryId)!.add(club.name);
          }
        });
      }
      
      // TODO: use proper types not ANY
      // Transform matches to include team names and club information
      const transformedMatches = matchesData?.map((match: any) => {
        // Get team details from the view
        const homeTeamDetails = teamMap.get(match.home_team_id);
        const awayTeamDetails = teamMap.get(match.away_team_id);
        
        // Process home team using per-category suffix logic
        const homeClub = homeTeamDetails?.club_category?.club;
        let homeTeamName: string;
        let homeShortName: string;
        
        if (!homeClub || !homeClub.name) {
          homeTeamName = 'Neznámý tým';
          homeShortName = 'Neznámý tým';
        } else {
          const clubName = homeClub.name;
          const teamSuffix = homeTeamDetails.team_suffix;
          const categoryId = match.category_id;
          
          // Check if this club needs suffixes in THIS specific category
          const clubsNeedingSuffixesInThisCategory = clubsNeedingSuffixesPerCategory.get(categoryId) || new Set();
          const thisClubNeedsSuffixes = clubsNeedingSuffixesInThisCategory.has(clubName);
          
          if (thisClubNeedsSuffixes) {
            // Club has max_teams > 1 in this category - include suffix
            homeTeamName = `${clubName} ${teamSuffix}`;
            homeShortName = homeClub.short_name ? `${homeClub.short_name} ${teamSuffix}` : homeTeamName;
          } else {
            // Club has max_teams = 1 in this category - no suffix needed
            homeTeamName = clubName;
            homeShortName = homeClub.short_name || clubName;
          }
        }
        
        const homeIsOwnClub = homeClub?.is_own_club === true;

        // Process away team using per-category suffix logic
        const awayClub = awayTeamDetails?.club_category?.club;
        let awayTeamName: string;
        let awayShortName: string;
        
        if (!awayClub || !awayClub.name) {
          awayTeamName = 'Neznámý tým';
          awayShortName = 'Neznámý tým';
        } else {
          const clubName = awayClub.name;
          const teamSuffix = awayTeamDetails.team_suffix;
          const categoryId = match.category_id;
          
          // Check if this club needs suffixes in THIS specific category
          const clubsNeedingSuffixesInThisCategory = clubsNeedingSuffixesPerCategory.get(categoryId) || new Set();
          const thisClubNeedsSuffixes = clubsNeedingSuffixesInThisCategory.has(clubName);
          
          if (thisClubNeedsSuffixes) {
            // Club has max_teams > 1 in this category - include suffix
            awayTeamName = `${clubName} ${teamSuffix}`;
            awayShortName = awayClub.short_name ? `${awayClub.short_name} ${teamSuffix}` : awayTeamName;
          } else {
            // Club has max_teams = 1 in this category - no suffix needed
            awayTeamName = clubName;
            awayShortName = awayClub.short_name || clubName;
          }
        }
        
        const awayIsOwnClub = awayClub?.is_own_club === true;
        
        return {
          ...match,
          home_team: {
            id: match.home_team_id,
            name: homeTeamName,
            short_name: homeShortName,
            is_own_club: homeIsOwnClub,
            logo_url: homeClub?.logo_url
          },
          away_team: {
            id: match.away_team_id,
            name: awayTeamName,
            short_name: awayShortName,
            is_own_club: awayIsOwnClub,
            logo_url: awayClub?.logo_url
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
        category: categoryId,
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
  }, [categoryId]);

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
