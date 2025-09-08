import { createClient } from '@/utils/supabase/server';
import { Category, Match, BlogPost } from '@/types';

export interface CategoryPageServerData {
  category: Category | null;
  matches: {
    autumn: Match[];
    spring: Match[];
  };
  posts: BlogPost[];
  standings: any[];
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
    const [postsResult, matchesResult, standingsResult] = await Promise.all([
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
        .order('position', { ascending: true }) : Promise.resolve({ data: [], error: null })
    ]);

    // Process results
    let posts: BlogPost[] = [];
    let matches: Match[] = [];
    let standings: any[] = [];

    if (includePosts && !postsResult.error && postsResult.data) {
      const allPosts = postsResult.data;
      
      // Filter posts by category using tag-based matching
      const categoryTagMap: { [key: string]: string[] } = {
        'men': ['muži', 'mužský', 'dospělí', 'muž', 'mužů', 'mužská', 'mužské', 'mužský tým', 'mužský oddíl', 'muži', 'muž', 'dospělí', 'senior', 'senioři'],
        'women': ['ženy', 'ženský', 'dospělé', 'žena', 'ženská', 'ženské', 'ženský tým', 'ženský oddíl', 'ženy', 'žena', 'dospělé', 'seniorky', 'seniorky'],
        'youngerBoys': ['mladší žáci', 'mladší', 'žáci', 'mladší žák', 'dorostenci', 'dorostenec', 'žáci', 'mladší', 'dorostenci'],
        'youngerGirls': ['mladší žačky', 'mladší', 'žačky', 'mladší žačka', 'dorostenky', 'dorostenka', 'žačky', 'mladší', 'dorostenky'],
        'olderBoys': ['starší žáci', 'starší', 'žáci', 'starší žák', 'junioři', 'junior', 'žáci', 'starší', 'junioři'],
        'olderGirls': ['starší žačky', 'starší', 'žačky', 'starší žačka', 'juniorky', 'juniorka', 'žačky', 'starší', 'juniorky'],
        'prepKids': ['přípravka', 'přípravky', 'děti', 'dítě', 'přípravka', 'přípravka', 'přípravka', 'děti', 'přípravka']
      };

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
      
      posts = filteredPosts.map((post: any) => ({
        ...post,
        excerpt: post.excerpt || post.content?.substring(0, 150) + '...' || 'Bez popisu',
        tags: post.tags || [],
        image_url: post.image_url || null
      }));
    }

    if (includeMatches && !matchesResult.error && matchesResult.data) {
      const allMatches = matchesResult.data;
      
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

    if (includeStandings && !standingsResult.error && standingsResult.data) {
      const allStandings = standingsResult.data;
      
      // Process standings to include team names and club information
      const transformedStandings = allStandings.map((standing: any) => {
        const team = standing.club_category_teams;
        const club = team?.club_category?.club;
        
        // Create team name from club + suffix
        const teamName = club && club.name
          ? `${club.name} ${team.team_suffix}`
          : 'Neznámý tým';
        
        // Create short team name from club short_name + suffix
        const shortTeamName = club?.short_name 
          ? `${club.short_name} ${team.team_suffix}`
          : teamName;
        
        // Create clean standing object with only our generated team data
        const processedStanding = {
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
        
        return processedStanding;
      });
      
      // Check if we need to show suffixes (multiple teams from same club in same category)
      const clubTeams = new Map<string, string[]>(); // club name -> array of team suffixes
      
      transformedStandings.forEach(standing => {
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
      
      // Update team names based on suffix needs - check per club, not globally
      standings = transformedStandings.map((standing: any) => {
        const team = standing.team;
        
        // Use the already generated team names from transformedStandings
        let displayName = team.name;
        let shortDisplayName = team.shortName;
        
        // Only apply suffix logic if we have valid team names
        if (team.name && team.name !== 'Neznámý tým') {
          // Extract club name from team name (everything except the last part which is the suffix)
          const parts = team.name.split(' ');
          const clubName = parts.slice(0, -1).join(' ');
          
          // Check if THIS specific club has multiple teams
          const clubSuffixes = clubTeams.get(clubName) || [];
          const thisClubNeedsSuffixes = clubSuffixes.length > 1;
          
          if (thisClubNeedsSuffixes) {
            // Keep the full name with suffix for clubs with multiple teams
            displayName = team.name;
            shortDisplayName = team.shortName;
          } else {
            // Show only club name without suffix for clubs with single team
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
