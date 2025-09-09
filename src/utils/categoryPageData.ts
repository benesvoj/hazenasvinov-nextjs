import { createClient } from '@/utils/supabase/server';
import { Category, Match, BlogPost, ProcessedStanding } from '@/types';
import { categoryTagMap } from '@/constants';

export interface CategoryPageServerData {
  category: Category | null;
  matches: {
    autumn: Match[];
    spring: Match[];
  };
  posts: BlogPost[];
  standings: ProcessedStanding[];
  season: any;
}

/**
 * Server-side data fetching for category pages
 * This fetches all data in optimized batches on the server
 * Reduces client-side requests to zero for initial load
 */
export async function getCategoryPageData(
  categorySlug: string,
  options: {
    includePosts?: boolean;
    includeMatches?: boolean;
    includeStandings?: boolean;
    postsLimit?: number;
  } = {}
): Promise<CategoryPageServerData> {
  const {
    includePosts = true,
    includeMatches = true,
    includeStandings = true,
    postsLimit = 3
  } = options;

  const supabase = await createClient();

  try {
      // Batch 1: Get category and active season in parallel
      const [categoryResult, seasonResult] = await Promise.all([
        supabase
          .from('categories')
          .select('id, code, name, description, is_active, sort_order')
          .eq('code', categorySlug)
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

    // Batch 2: Execute remaining queries in parallel
    const [postsResult, matchesResult, standingsResult, clubCategoriesResult] = await Promise.all([
      // Posts query
      includePosts ? supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(postsLimit) : Promise.resolve({ data: [], error: null }),
      
      // Matches query with team details
      includeMatches ? supabase
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
        .order('date', { ascending: true }) : Promise.resolve({ data: [], error: null }),
      
      // Standings query with team details
      includeStandings ? supabase
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
          team:club_category_teams!team_id(
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
        .order('position', { ascending: true }) : Promise.resolve({ data: [], error: null }),
      
      // Club categories query - moved from separate execution
      supabase
        .from('club_categories')
        .select(`
          id,
          max_teams,
          club:clubs(
            id,
            name,
            short_name,
            logo_url,
            is_own_club
          )
        `)
        .eq('category_id', category.id)
        .eq('season_id', season.id)
    ]);

    // Process results
    let posts: BlogPost[] = [];
    let matches: Match[] = [];
    let standings: ProcessedStanding[] = [];
    
    // Get club categories to determine which clubs need suffixes (max_teams > 1)
    const clubsNeedingSuffixes = new Set<string>();
    if (!clubCategoriesResult.error && clubCategoriesResult.data) {
      clubCategoriesResult.data.forEach((clubCategory: any) => {
        const club = clubCategory.club;
        if (club && club.name && clubCategory.max_teams > 1) {
          clubsNeedingSuffixes.add(club.name);
        }
      });
    }

    if (includePosts && !postsResult.error && postsResult.data) {
      const allPosts = postsResult.data;

      const tagPatterns = categoryTagMap[categorySlug] || [];
      
      // Filter posts by tag matching
      let filteredPosts = allPosts;
      if (tagPatterns.length > 0) {
        filteredPosts = allPosts.filter((post: any) => {
          if (!post.tags || !Array.isArray(post.tags)) return false;
          
          return post.tags.some((tag: string) => 
            tagPatterns.some(pattern => 
              tag.toLowerCase().includes(pattern.toLowerCase()) || 
              pattern.toLowerCase().includes(tag.toLowerCase())
            )
          );
        });
      }
      
      // Keep only category-specific posts (no fallback to all posts)
      
      posts = filteredPosts.map((post: BlogPost) => ({
        ...post,
        excerpt: post.excerpt || post.content?.substring(0, 150) + '...' || 'Bez popisu',
        tags: post.tags || [],
        image_url: post.image_url || undefined
      }));
    }

    if (includeMatches && !matchesResult.error && matchesResult.data) {
      const allMatches = matchesResult.data;
      
      // Process team names for each match using the same suffix logic as standings
      const processedMatches = allMatches.map((match: any) => {
        // Process home team
        const homeTeamDetails = match.home_team;
        const homeClub = homeTeamDetails?.club_category?.club;
        
        let homeTeamName: string;
        let homeShortName: string;
        
        if (!homeClub || !homeClub.name) {
          homeTeamName = 'Neznámý tým';
          homeShortName = 'Neznámý tým';
        } else {
          const clubName = homeClub.name;
          const teamSuffix = homeTeamDetails.team_suffix;
          const thisClubNeedsSuffixes = clubsNeedingSuffixes.has(clubName);
          
          if (thisClubNeedsSuffixes) {
            // Club has max_teams > 1 - include suffix
            homeTeamName = `${clubName} ${teamSuffix}`;
            homeShortName = homeClub.short_name ? `${homeClub.short_name} ${teamSuffix}` : homeTeamName;
          } else {
            // Club has max_teams = 1 - no suffix needed
            homeTeamName = clubName;
            homeShortName = homeClub.short_name || clubName;
          }
        }
        
        const homeIsOwnClub = homeClub?.is_own_club === true;

        // Process away team
        const awayTeamDetails = match.away_team;
        const awayClub = awayTeamDetails?.club_category?.club;
        
        let awayTeamName: string;
        let awayShortName: string;
        
        if (!awayClub || !awayClub.name) {
          awayTeamName = 'Neznámý tým';
          awayShortName = 'Neznámý tým';
        } else {
          const clubName = awayClub.name;
          const teamSuffix = awayTeamDetails.team_suffix;
          const thisClubNeedsSuffixes = clubsNeedingSuffixes.has(clubName);
          
          if (thisClubNeedsSuffixes) {
            // Club has max_teams > 1 - include suffix
            awayTeamName = `${clubName} ${teamSuffix}`;
            awayShortName = awayClub.short_name ? `${awayClub.short_name} ${teamSuffix}` : awayTeamName;
          } else {
            // Club has max_teams = 1 - no suffix needed
            awayTeamName = clubName;
            awayShortName = awayClub.short_name || clubName;
          }
        }
        
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

    if (includeStandings && !standingsResult.error && standingsResult.data) {
      const allStandings = standingsResult.data;
      
      // Club analysis already done above
      
      // Process standings to include team names and club information
      const transformedStandings = allStandings.map((standing: any): ProcessedStanding => {
        const team = standing.team;
        const club = team?.club_category?.club;
        
        if (!club || !club.name) {
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
              name: 'Neznámý tým',
              shortName: 'Neznámý tým',
              displayName: 'Neznámý tým',
              shortDisplayName: 'Neznámý tým',
              logo_url: undefined
            }
          };
        }
        
        const clubName = club.name;
        const teamSuffix = team.team_suffix;
        const thisClubNeedsSuffixes = clubsNeedingSuffixes.has(clubName);
        
        // Create team names based on whether this club needs suffixes
        let teamName: string;
        let shortTeamName: string;
        
        if (thisClubNeedsSuffixes) {
          // Club has max_teams > 1 - include suffix
          teamName = `${clubName} ${teamSuffix}`;
          shortTeamName = club.short_name ? `${club.short_name} ${teamSuffix}` : teamName;
        } else {
          // Club has max_teams = 1 - no suffix needed
          teamName = clubName;
          shortTeamName = club.short_name || clubName;
        }
        
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
      
      standings = transformedStandings;
      
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


    return {
      category,
      matches: {
        autumn: autumnMatches,
        spring: springMatches
      },
      posts,
      standings: standings,
      season
    };

  } catch (error) {
    console.error('Error fetching category page data:', error);
    throw error;
  }
}
