import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Match } from '@/types';
import { translations } from '@/lib/translations';
import { getTeamDisplayNameSafe } from '@/utils/teamDisplay';

export interface SeasonalMatches {
  autumn: Match[];
  spring: Match[];
}

export function useFetchMatches(categorySlug: string) {
  const [matches, setMatches] = useState<SeasonalMatches>({ autumn: [], spring: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!categorySlug) return;
      
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        
        // console.log('🔍 Fetching matches for category:', categorySlug);
        
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
        
        // Get the active season
        // console.log('📅 Step 2: Fetching active season...');
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .select('id, name')
          .eq('is_active', true)
          .single();
        
        if (seasonError) {
        //   console.error('❌ Season error:', seasonError);
          throw new Error(`Active season not found: ${seasonError.message}`);
        }
        
        // console.log('✅ Active season found:', seasonData);
        
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
        const transformedMatches = matchesData?.map((match: any) => {
          // Check if each team belongs to our club individually
          const homeTeamIsOwnClub = match.home_team?.club_category?.club?.is_own_club === true;
          const awayTeamIsOwnClub = match.away_team?.club_category?.club?.is_own_club === true;
          
          // Smart suffix logic: only show suffix if club has multiple teams in this category
          const getTeamDisplayName = (team: any) => {
            if (!team?.club_category?.club) return translations.team.unknownTeam;
            
            const clubName = team.club_category.club.name;
            const teamSuffix = team.team_suffix || 'A';
            
            // Check if this club has multiple teams in this category
            const clubId = team.club_category.club.id;
            const teamCount = matchesData?.filter((m: any) => 
              (m.home_team?.club_category?.club?.id === clubId || 
               m.away_team?.club_category?.club?.id === clubId)
            ).length || 0;
            
            // Use the utility function for consistent logic
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
        
        // Filter matches to only show those where our club is playing
        const ownClubMatches = transformedMatches.filter((match: any) => 
          match.home_team?.is_own_club === true || match.away_team?.is_own_club === true
        );
        
        // console.log('🏆 Own club matches found:', ownClubMatches.length);
        
        // Group matches by season (autumn/spring)
        const autumnMatches: Match[] = [];
        const springMatches: Match[] = [];
        
        ownClubMatches.forEach((match: any) => {
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
          ownClubMatches: ownClubMatches.length,
          autumnCount: autumnMatches.length,
          springCount: springMatches.length,
          seasonQuery: `Found active season: ${seasonData.name} (ID: ${seasonData.id})`,
          filtering: `Filtered ${matchesData?.length || 0} total matches to ${ownClubMatches.length} own club matches`
        });
        
      } catch (err) {
        // console.error('💥 Failed to fetch matches:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(new Error(errorMessage));
        setDebugInfo({ error: errorMessage, categorySlug });
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [categorySlug]);

  return { matches, loading, error, debugInfo };
}
