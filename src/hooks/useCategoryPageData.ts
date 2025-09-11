import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Category, Match, BlogPost } from '@/types';

export interface CategoryPageData {
  category: Category | null;
  matches: {
    autumn: Match[];
    spring: Match[];
  };
  posts: BlogPost[];
  standings: any[];
  loading: boolean;
  error: string | null;
}

export interface UseCategoryPageDataOptions {
  includePosts?: boolean;
  includeMatches?: boolean;
  includeStandings?: boolean;
  postsLimit?: number;
}

/**
 * Unified hook to fetch all data needed for a category page in optimized batches
 * This reduces the number of requests from 60+ to ~5-8 requests
 */
export function useCategoryPageData(
  categorySlug: string,
  options: UseCategoryPageDataOptions = {}
) {
  const {
    includePosts = true,
    includeMatches = true,
    includeStandings = true,
    postsLimit = 3
  } = options;

  const [data, setData] = useState<CategoryPageData>({
    category: null,
    matches: { autumn: [], spring: [] },
    posts: [],
    standings: [],
    loading: true,
    error: null
  });

  const fetchCategoryPageData = useCallback(async () => {
    if (!categorySlug) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      const supabase = createClient();

      // Batch 1: Get category and active season in parallel
      const [categoryResult, seasonResult] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, description, is_active, sort_order')
          .eq('id', categorySlug)
          .single(),
        supabase
          .from('seasons')
          .select('id, name, is_active')
          .eq('is_active', true)
          .single()
      ]);

      if (categoryResult.error) {
        throw new Error(`Category not found: ${categoryResult.error.message}`);
      }

      if (seasonResult.error) {
        throw new Error(`Active season not found: ${seasonResult.error.message}`);
      }

      const category = categoryResult.data;
      const season = seasonResult.data;

      // Batch 2: Prepare all remaining queries based on what we need
      const queries: Promise<any>[] = [];

      // Posts query - filter by category
      if (includePosts) {
        queries.push(
          supabase
            .from('blog_posts')
            .select('*')
            .eq('status', 'published')
            .eq('category_id', category.id)
            .order('created_at', { ascending: false })
            .limit(postsLimit)
        );
      }

      // Matches query with team details
      if (includeMatches) {
        queries.push(
          supabase
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
              away_team_id,
              home_team:home_team_id(
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
              ),
              away_team:away_team_id(
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
              )
            `)
            .eq('category_id', category.id)
            .eq('season_id', season.id)
            .order('date', { ascending: true })
        );
      }

      // Standings query with team details
      if (includeStandings) {
        queries.push(
          supabase
            .from('standings')
            .select(`
              id,
              team_id,
              matches,
              wins,
              draws,
              losses,
              goals_for,
              goals_against,
              points,
              position,
              club_category_teams!team_id(
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
              )
            `)
            .eq('category_id', category.id)
            .eq('season_id', season.id)
            .order('position', { ascending: true })
        );
      }

      // Execute all remaining queries in parallel
      const results = await Promise.all(queries);

      // Process results
      let posts: BlogPost[] = [];
      let matches: Match[] = [];
      let standings: any[] = [];

      let resultIndex = 0;

      if (includePosts) {
        const postsResult = results[resultIndex++];
        if (postsResult.error) {
          console.warn('Failed to fetch posts:', postsResult.error);
        } else {
          const allPosts = postsResult.data || [];
          
          // Posts are already filtered by category_id at the database level
          posts = allPosts.map((post: any) => ({
            ...post,
            excerpt: post.excerpt || post.content?.substring(0, 150) + '...' || 'Bez popisu',
            tags: post.tags || [],
            image_url: post.image_url || null
          }));
        }
      }

      if (includeMatches) {
        const matchesResult = results[resultIndex++];
        if (matchesResult.error) {
          console.warn('Failed to fetch matches:', matchesResult.error);
        } else {
          const allMatches = matchesResult.data || [];
          
          // Process team names for each match using the already fetched team data
          const processedMatches = allMatches.map((match: any) => {
            // Process home team
            const homeTeamDetails = match.home_team;
            const homeClub = homeTeamDetails?.club_category?.club;
            const homeTeamName = homeClub 
              ? `${homeClub.name} ${homeTeamDetails.team_suffix}`
              : 'Neznámý tým';
            const homeShortName = homeClub?.short_name 
              ? `${homeClub.short_name} ${homeTeamDetails.team_suffix}`
              : homeTeamName;
            const homeIsOwnClub = homeClub?.is_own_club === true;

            // Process away team
            const awayTeamDetails = match.away_team;
            const awayClub = awayTeamDetails?.club_category?.club;
            const awayTeamName = awayClub 
              ? `${awayClub.name} ${awayTeamDetails.team_suffix}`
              : 'Neznámý tým';
            const awayShortName = awayClub?.short_name 
              ? `${awayClub.short_name} ${awayTeamDetails.team_suffix}`
              : awayTeamName;
            const awayIsOwnClub = awayClub?.is_own_club === true;

            return {
              ...match,
              home_team: {
                id: homeTeamDetails?.id,
                name: homeTeamName,
                short_name: homeShortName,
                logo_url: homeClub?.logo_url,
                is_own_club: homeIsOwnClub
              },
              away_team: {
                id: awayTeamDetails?.id,
                name: awayTeamName,
                short_name: awayShortName,
                logo_url: awayClub?.logo_url,
                is_own_club: awayIsOwnClub
              }
            };
          });

          // Filter matches to only show those where the user's club is playing
          matches = processedMatches.filter((match: any) => 
            match.home_team?.is_own_club === true || match.away_team?.is_own_club === true
          ) as Match[];
        }
      }

      if (includeStandings) {
        const standingsResult = results[resultIndex++];
        if (standingsResult.error) {
          console.warn('Failed to fetch standings:', standingsResult.error);
        } else {
          const allStandings = standingsResult.data || [];
          
          // Process standings to include team names and club information
          const transformedStandings = allStandings.map((standing: any) => {
            const team = standing.club_category_teams;
            const club = team?.club_category?.club;
            
            // Debug logging
            if (!team || !club) {
              console.warn('Missing team or club data for standing:', standing);
              console.log('Team data:', team);
              console.log('Club data:', club);
            }
            
            // Create team name from club + suffix
            const teamName = club 
              ? `${club.name} ${team.team_suffix}`
              : 'Neznámý tým';
            
            // Create short team name from club short_name + suffix
            const shortTeamName = club?.short_name 
              ? `${club.short_name} ${team.team_suffix}`
              : teamName;
            
            // Create clean standing object with only our generated team data
            return {
              id: standing.id,
              team_id: standing.team_id,
              matches: standing.matches,
              wins: standing.wins,
              draws: standing.draws,
              losses: standing.losses,
              goals_for: standing.goals_for,
              goals_against: standing.goals_against,
              points: standing.points,
              position: standing.position,
              team: {
                id: team?.id,
                name: teamName,
                shortName: shortTeamName,
                displayName: teamName,
                shortDisplayName: shortTeamName,
                logo_url: club?.logo_url
              }
            };
          });
          
          // Check if we need to show suffixes (multiple teams from same club in same category)
          const clubTeams = new Map<string, string[]>(); // club name -> array of team suffixes
          
          transformedStandings.forEach((standing: any) => {
            const team = standing.team;
            if (team?.name && team.name !== 'Neznámý tým') {
              const parts = team.name.split(' ');
              if (parts.length > 1) {
                const suffix = parts[parts.length - 1]; // Last part is the suffix
                const clubName = parts.slice(0, -1).join(' '); // Everything except suffix
                
                if (!clubTeams.has(clubName)) {
                  clubTeams.set(clubName, []);
                }
                clubTeams.get(clubName)!.push(suffix);
              }
            }
          });
          
          // Check if any club has multiple teams
          let needsSuffixes = false;
          for (const [clubName, suffixes] of clubTeams) {
            if (suffixes.length > 1) {
              needsSuffixes = true;
              break;
            }
          }
          
          // Update team names based on suffix needs
          standings = transformedStandings.map((standing: any) => {
            const team = standing.team;
            
            // Use the already generated team names from transformedStandings
            let displayName = team.name;
            let shortDisplayName = team.shortName;
            
            // Only apply suffix logic if we have valid team names
            if (team.name && team.name !== 'Neznámý tým') {
              if (needsSuffixes) {
                // Keep the full name with suffix
                displayName = team.name;
                shortDisplayName = team.shortName;
              } else {
                // Show only club name without suffix
                const clubName = team.name.split(' ').slice(0, -1).join(' ');
                const shortClubName = team.shortName.split(' ').slice(0, -1).join(' ');
                displayName = clubName || team.name;
                shortDisplayName = shortClubName || team.shortName;
              }
            }
            
            return {
              ...standing,
              team: {
                ...team,
                displayName: displayName,
                shortDisplayName: shortDisplayName
              }
            };
          });
        }
      }

      // Process matches into seasonal groups
      const autumnMatches: Match[] = [];
      const springMatches: Match[] = [];

      matches.forEach((match: any) => {
        const matchDate = new Date(match.date);
        const month = matchDate.getMonth() + 1;

        if (month >= 8 || month <= 1) {
          autumnMatches.push(match);
        } else {
          springMatches.push(match);
        }
      });

      // Sort matches by date
      autumnMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      springMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Process standings to include team names
      const processedStandings = standings.map((standing: any) => {
        const team = standing.team;
        const club = team?.club_category?.club;
        
        const teamName = club 
          ? `${club.name} ${team.team_suffix}`
          : 'Neznámý tým';
        
        const shortTeamName = club?.short_name 
          ? `${club.short_name} ${team.team_suffix}`
          : teamName;

        return {
          ...standing,
          team: {
            id: team?.id,
            name: teamName,
            shortName: shortTeamName,
            logo_url: club?.logo_url
          }
        };
      });

      setData({
        category,
        matches: {
          autumn: autumnMatches,
          spring: springMatches
        },
        posts,
        standings: processedStandings,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching category page data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data'
      }));
    }
  }, [categorySlug, includePosts, includeMatches, includeStandings, postsLimit]);

  useEffect(() => {
    fetchCategoryPageData();
  }, [fetchCategoryPageData]);

  const refresh = useCallback(() => {
    fetchCategoryPageData();
  }, [fetchCategoryPageData]);

  return {
    ...data,
    refresh
  };
}
