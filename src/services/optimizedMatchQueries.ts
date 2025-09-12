/**
 * Performance-optimized match query service with intelligent caching
 */

import {createClient} from '@/utils/supabase/client';
import {transformMatchWithTeamNames, getTeamDisplayNameSafe} from '@/utils/teamDisplay';
import {
  matchCache,
  teamCache,
  categoryCache,
  cacheKeys,
  invalidateCache,
} from '@/lib/performanceCache';
import type {Match} from '@/types/match';
import type {MatchQueryOptions, MatchQueryResult, SeasonalMatchQueryResult} from './matchQueries';

// Optimized query selectors with minimal data fetching
const OPTIMIZED_MATCH_SELECT = `
  id,
  date,
  time,
  venue,
  status,
  home_score,
  away_score,
  home_score_halftime,
  away_score_halftime,
  matchweek,
  match_number,
  category_id,
  season_id,
  home_team_id,
  away_team_id,
  category:categories(
    id,
    name,
    description,
    slug
  ),
  season:seasons(
    id,
    name,
    start_date,
    end_date
  )
`;

const OPTIMIZED_MATCH_WITH_TEAMS_SELECT = `
  ${OPTIMIZED_MATCH_SELECT},
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
`;

// Query deduplication
const pendingQueries = new Map<string, Promise<any>>();

/**
 * Get team counts for all clubs in a category
 * This is needed for proper suffix display logic
 */
export async function getClubTeamCounts(
  categoryId: string,
  seasonId: string
): Promise<Map<string, number>> {
  const cacheKey = `team_counts_${categoryId}_${seasonId}`;

  return getCachedOrExecute(
    cacheKey,
    teamCache,
    async () => {
      const supabase = createClient();
      const {data, error} = await supabase
        .from('club_category_teams')
        .select(
          `
          id,
          club_category:club_categories(
            club:clubs(id)
          )
        `
        )
        .eq('club_category.category_id', categoryId)
        .eq('club_category.season_id', seasonId);

      if (error) {
        console.warn('Failed to fetch team counts:', error.message);
        return new Map();
      }

      const clubTeamCounts = new Map<string, number>();
      data?.forEach((team: any) => {
        const clubId = team.club_category?.club?.id;
        if (clubId) {
          clubTeamCounts.set(clubId, (clubTeamCounts.get(clubId) || 0) + 1);
        }
      });

      return clubTeamCounts;
    },
    5 * 60 * 1000 // 5 minutes TTL
  );
}

/**
 * Get cached data or execute query with deduplication
 */
async function getCachedOrExecute<T>(
  cacheKey: string,
  cache: any,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Check if query is already pending
  if (pendingQueries.has(cacheKey)) {
    return pendingQueries.get(cacheKey)!;
  }

  // Execute query
  const queryPromise = queryFn()
    .then((result) => {
      // Cache the result
      cache.set(cacheKey, result, ttl);
      // Remove from pending queries
      pendingQueries.delete(cacheKey);
      return result;
    })
    .catch((error) => {
      // Remove from pending queries on error
      pendingQueries.delete(cacheKey);
      throw error;
    });

  pendingQueries.set(cacheKey, queryPromise);
  return queryPromise;
}

/**
 * Optimized basic match query with caching
 */
export async function getMatchesBasicOptimized(
  options: MatchQueryOptions = {}
): Promise<MatchQueryResult> {
  const cacheKey = cacheKeys.matches.basic(options);

  return getCachedOrExecute(
    cacheKey,
    matchCache,
    async () => {
      const supabase = createClient();
      let query = supabase.from('matches').select(OPTIMIZED_MATCH_SELECT);

      // Apply filters efficiently
      if (options.categoryId) query = query.eq('category_id', options.categoryId);
      if (options.seasonId) query = query.eq('season_id', options.seasonId);
      if (options.status) query = query.eq('status', options.status);
      if (options.dateFrom) query = query.gte('date', options.dateFrom);
      if (options.dateTo) query = query.lte('date', options.dateTo);
      if (options.matchweek !== undefined) query = query.eq('matchweek', options.matchweek);
      if (options.limit) query = query.limit(options.limit);
      if (options.offset)
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

      const {data, error, count} = await query.order('date', {ascending: true});

      if (error) {
        return {data: [], error: error.message, count: 0};
      }

      return {data: data || [], error: null, count: count || 0};
    },
    2 * 60 * 1000 // 2 minutes TTL
  );
}

/**
 * Optimized match query with team details and intelligent caching
 */
export async function getMatchesWithTeamsOptimized(
  options: MatchQueryOptions = {}
): Promise<MatchQueryResult> {
  const cacheKey = cacheKeys.matches.withTeams(options);

  return getCachedOrExecute(
    cacheKey,
    matchCache,
    async () => {
      const supabase = createClient();
      let query = supabase.from('matches').select(OPTIMIZED_MATCH_WITH_TEAMS_SELECT);

      // Apply filters
      if (options.categoryId) query = query.eq('category_id', options.categoryId);
      if (options.seasonId) query = query.eq('season_id', options.seasonId);
      if (options.status) query = query.eq('status', options.status);
      if (options.dateFrom) query = query.gte('date', options.dateFrom);
      if (options.dateTo) query = query.lte('date', options.dateTo);
      if (options.matchweek !== undefined) query = query.eq('matchweek', options.matchweek);
      if (options.limit) query = query.limit(options.limit);
      if (options.offset)
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

      const {data, error, count} = await query.order('date', {ascending: true});

      if (error) {
        return {data: [], error: error.message, count: 0};
      }

      const matches = data || [];

      // Get team counts for proper suffix display
      let clubTeamCounts = new Map<string, number>();
      if (options.categoryId && options.seasonId) {
        clubTeamCounts = await getClubTeamCounts(options.categoryId, options.seasonId);
      }

      // Transform team names with proper team counting
      const transformedMatches = matches.map((match: any) =>
        transformMatchWithTeamNames(match, matches, {
          useTeamMap: false,
          teamDetails: matches,
          clubTeamCounts: clubTeamCounts,
        })
      );

      // Apply own club filter if requested
      let filteredMatches = transformedMatches;
      if (options.ownClubOnly) {
        filteredMatches = transformedMatches.filter(
          (match: Match) => match.home_team_is_own_club || match.away_team_is_own_club
        );
      }

      return {data: filteredMatches, error: null, count: count || 0};
    },
    2 * 60 * 1000 // 2 minutes TTL
  );
}

/**
 * Optimized seasonal match query with smart caching
 */
export async function getMatchesSeasonalOptimized(
  categoryId: string,
  seasonId: string,
  options: Omit<MatchQueryOptions, 'categoryId' | 'seasonId'> = {}
): Promise<SeasonalMatchQueryResult> {
  const cacheKey = cacheKeys.matches.seasonal(categoryId, seasonId);

  return getCachedOrExecute(
    cacheKey,
    matchCache,
    async () => {
      const supabase = createClient();
      let query = supabase
        .from('matches')
        .select(OPTIMIZED_MATCH_WITH_TEAMS_SELECT)
        .eq('category_id', categoryId)
        .eq('season_id', seasonId);

      // Apply additional filters
      if (options.status) query = query.eq('status', options.status);
      if (options.dateFrom) query = query.gte('date', options.dateFrom);
      if (options.dateTo) query = query.lte('date', options.dateTo);
      if (options.matchweek !== undefined) query = query.eq('matchweek', options.matchweek);
      if (options.limit) query = query.limit(options.limit);

      const {data, error, count} = await query.order('date', {ascending: true});

      if (error) {
        return {autumn: [], spring: [], error: error.message, count: 0};
      }

      const matches = data || [];

      // Get team counts for proper suffix display
      let clubTeamCounts = new Map<string, number>();
      if (categoryId && seasonId) {
        clubTeamCounts = await getClubTeamCounts(categoryId, seasonId);
      }

      // Transform team names with proper team counting
      const transformedMatches = matches.map((match: any) => {
        const homeClubId = match.home_team?.club_category?.club?.id;
        const awayClubId = match.away_team?.club_category?.club?.id;

        return transformMatchWithTeamNames(match, matches, {
          useTeamMap: false,
          teamDetails: matches,
          clubTeamCounts: clubTeamCounts,
        });
      });

      // Apply own club filter if requested
      let filteredMatches = transformedMatches;
      if (options.ownClubOnly) {
        filteredMatches = transformedMatches.filter(
          (match: Match) => match.home_team_is_own_club || match.away_team_is_own_club
        );
      }

      // Split into autumn and spring seasons
      const autumn: Match[] = [];
      const spring: Match[] = [];

      filteredMatches.forEach((match: Match) => {
        const month = new Date(match.date).getMonth() + 1; // 1-12
        if (month >= 8 && month <= 12) {
          autumn.push(match);
        } else {
          spring.push(match);
        }
      });

      return {autumn, spring, error: null, count: count || 0};
    },
    2 * 60 * 1000 // 2 minutes TTL
  );
}

/**
 * Optimized own club matches query using materialized view
 */
export async function getOwnClubMatchesOptimized(
  categoryId: string,
  seasonId: string,
  options: Omit<MatchQueryOptions, 'categoryId' | 'seasonId'> = {}
): Promise<SeasonalMatchQueryResult> {
  const cacheKey = cacheKeys.matches.ownClub(categoryId, seasonId);

  return getCachedOrExecute(
    cacheKey,
    matchCache,
    async () => {
      const supabase = createClient();
      let query = supabase
        .from('own_club_matches')
        .select('*')
        .eq('category_id', categoryId)
        .eq('season_id', seasonId);

      // Apply additional filters
      if (options.status) query = query.eq('status', options.status);
      if (options.dateFrom) query = query.gte('date', options.dateFrom);
      if (options.dateTo) query = query.lte('date', options.dateTo);
      if (options.matchweek !== undefined) query = query.eq('matchweek', options.matchweek);
      if (options.limit) query = query.limit(options.limit);

      const {data, error, count} = await query.order('date', {ascending: true});

      if (error) {
        // Fallback to original method if materialized view doesn't exist
        console.warn(
          'Materialized view not available, falling back to original query:',
          error.message
        );
        return getMatchesSeasonalOptimized(categoryId, seasonId, {
          ...options,
          ownClubOnly: true,
        });
      }

      // Check if we have category information in the materialized view data
      const hasCategoryInfo = data && data.length > 0 && data[0].category_name;

      if (!hasCategoryInfo) {
        // Materialized view doesn't include category info, fall back to regular query
        console.warn(
          'Materialized view missing category information, falling back to regular query'
        );
        return getMatchesSeasonalOptimized(categoryId, seasonId, {
          ...options,
          ownClubOnly: true,
        });
      }

      const matches = data || [];

      // Get team counts for proper suffix display
      const clubTeamCounts = await getClubTeamCounts(categoryId, seasonId);

      // Transform matches to standard format
      const transformedMatches = matches.map((match: any) => {
        const homeClubId = match.home_club_id;
        const awayClubId = match.away_club_id;

        // Calculate team names with proper suffix logic
        const homeTeamName = getTeamDisplayNameSafe(
          match.home_club_name,
          match.home_team_suffix || 'A',
          clubTeamCounts.get(homeClubId) || 1,
          'Home team'
        );
        const awayTeamName = getTeamDisplayNameSafe(
          match.away_club_name,
          match.away_team_suffix || 'A',
          clubTeamCounts.get(awayClubId) || 1,
          'Away team'
        );

        return {
          ...match,
          // Category information
          category: {
            id: match.category_id_full,
            name: match.category_name,
            description: match.category_description,
            slug: match.category_slug,
          },
          // Season information
          season: {
            id: match.season_id_full,
            name: match.season_name,
            start_date: match.season_start_date,
            end_date: match.season_end_date,
          },
          // Home team information
          home_team: {
            id: match.home_team_id,
            name: homeTeamName,
            short_name: match.home_club_short_name,
            is_own_club: match.home_is_own_club,
            logo_url: match.home_club_logo_url,
          },
          // Away team information
          away_team: {
            id: match.away_team_id,
            name: awayTeamName,
            short_name: match.away_club_short_name,
            is_own_club: match.away_is_own_club,
            logo_url: match.away_club_logo_url,
          },
          home_team_is_own_club: match.home_is_own_club,
          away_team_is_own_club: match.away_is_own_club,
        };
      });

      // Split into autumn and spring seasons
      const autumn: Match[] = [];
      const spring: Match[] = [];

      transformedMatches.forEach((match: Match) => {
        const month = new Date(match.date).getMonth() + 1; // 1-12
        if (month >= 8 && month <= 12) {
          autumn.push(match);
        } else {
          spring.push(match);
        }
      });

      return {autumn, spring, error: null, count: count || 0};
    },
    1 * 60 * 1000 // 1 minute TTL for own club matches
  );
}

/**
 * Batch query multiple match types efficiently
 */
export async function getMatchesBatchOptimized(
  queries: Array<{
    type: 'basic' | 'withTeams' | 'seasonal' | 'ownClub';
    options: MatchQueryOptions;
    categoryId?: string;
    seasonId?: string;
  }>
): Promise<Array<MatchQueryResult | SeasonalMatchQueryResult>> {
  const promises = queries.map(async ({type, options, categoryId, seasonId}) => {
    switch (type) {
      case 'basic':
        return getMatchesBasicOptimized(options);
      case 'withTeams':
        return getMatchesWithTeamsOptimized(options);
      case 'seasonal':
        if (!categoryId || !seasonId) {
          throw new Error('categoryId and seasonId required for seasonal query');
        }
        return getMatchesSeasonalOptimized(categoryId, seasonId, options);
      case 'ownClub':
        if (!categoryId || !seasonId) {
          throw new Error('categoryId and seasonId required for ownClub query');
        }
        return getOwnClubMatchesOptimized(categoryId, seasonId, options);
      default:
        throw new Error(`Unknown query type: ${type}`);
    }
  });

  return Promise.all(promises);
}

/**
 * Preload critical match data
 */
export async function preloadMatchData(categoryId: string, seasonId: string): Promise<void> {
  const preloadPromises = [
    getMatchesSeasonalOptimized(categoryId, seasonId),
    getOwnClubMatchesOptimized(categoryId, seasonId),
  ];

  // Don't wait for completion, just start the requests
  Promise.all(preloadPromises).catch((error) => {
    console.warn('Failed to preload match data:', error);
  });
}

/**
 * Invalidate match cache for specific category/season
 */
export function invalidateMatchCache(categoryId?: string, seasonId?: string): void {
  if (categoryId) {
    invalidateCache.matchesByCategory(categoryId);
  }
  if (seasonId) {
    invalidateCache.matchesBySeason(seasonId);
  }
  if (!categoryId && !seasonId) {
    invalidateCache.matches();
  }
}

export {
  invalidateCache as invalidateMatchCacheAll,
  matchCache,
  teamCache,
  categoryCache,
  cacheKeys,
};
