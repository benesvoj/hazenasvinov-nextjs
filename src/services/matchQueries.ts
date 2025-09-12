import {createClient} from '@/utils/supabase/client';
import {Match} from '@/types';
import {transformMatchWithTeamNames} from '@/utils/teamDisplay';

// Types for query options
export interface MatchQueryOptions {
  categoryId?: string;
  seasonId?: string;
  ownClubOnly?: boolean;
  includeTeamDetails?: boolean;
  status?: 'upcoming' | 'completed' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
  matchweek?: number;
  limit?: number;
  offset?: number;
}

export interface MatchQueryResult {
  data: Match[];
  error: string | null;
  count?: number;
}

export interface SeasonalMatchQueryResult {
  autumn: Match[];
  spring: Match[];
  error: string | null;
}

// Base query selectors
const BASIC_MATCH_SELECT = `
  id,
  date,
  time,
  venue,
  competition,
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
  created_at,
  updated_at
`;

const MATCH_WITH_TEAMS_SELECT = `
  ${BASIC_MATCH_SELECT},
  category:categories(
    id,
    name,
    description
  ),
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

/**
 * Get basic match data without team details
 */
export async function getMatchesBasic(options: MatchQueryOptions = {}): Promise<MatchQueryResult> {
  try {
    const supabase = createClient();
    let query = supabase.from('matches').select(BASIC_MATCH_SELECT);

    // Apply filters
    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }
    if (options.seasonId) {
      query = query.eq('season_id', options.seasonId);
    }
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.dateFrom) {
      query = query.gte('date', options.dateFrom);
    }
    if (options.dateTo) {
      query = query.lte('date', options.dateTo);
    }
    if (options.matchweek) {
      query = query.eq('matchweek', options.matchweek);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const {data, error, count} = await query.order('date', {ascending: true});

    if (error) {
      return {data: [], error: error.message};
    }

    return {data: data || [], error: null, count: count || 0};
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get matches with full team details and club information
 */
export async function getMatchesWithTeams(
  options: MatchQueryOptions = {}
): Promise<MatchQueryResult> {
  try {
    const supabase = createClient();
    let query = supabase.from('matches').select(MATCH_WITH_TEAMS_SELECT);

    // Apply filters
    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }
    if (options.seasonId) {
      query = query.eq('season_id', options.seasonId);
    }
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.dateFrom) {
      query = query.gte('date', options.dateFrom);
    }
    if (options.dateTo) {
      query = query.lte('date', options.dateTo);
    }
    if (options.matchweek) {
      query = query.eq('matchweek', options.matchweek);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const {data, error, count} = await query.order('date', {ascending: true});

    if (error) {
      return {data: [], error: error.message};
    }

    // Transform team names if needed
    const transformedData = data?.map(transformMatchWithTeamNames) || [];

    // Filter for own club matches if requested
    let filteredData = transformedData;
    if (options.ownClubOnly) {
      filteredData = transformedData.filter(
        (match: Match) => match.home_team_is_own_club || match.away_team_is_own_club
      );
    }

    return {data: filteredData, error: null, count: count || 0};
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get matches for a specific category
 */
export async function getMatchesByCategory(
  categoryId: string,
  seasonId?: string,
  options: Omit<MatchQueryOptions, 'categoryId'> = {}
): Promise<MatchQueryResult> {
  return getMatchesWithTeams({
    ...options,
    categoryId,
    seasonId,
  });
}

/**
 * Get matches for a specific season
 */
export async function getMatchesBySeason(
  seasonId: string,
  categoryId?: string,
  options: Omit<MatchQueryOptions, 'seasonId'> = {}
): Promise<MatchQueryResult> {
  return getMatchesWithTeams({
    ...options,
    seasonId,
    categoryId,
  });
}

/**
 * Get only own club matches
 */
export async function getOwnClubMatches(
  categoryId?: string,
  seasonId?: string,
  options: Omit<MatchQueryOptions, 'ownClubOnly'> = {}
): Promise<MatchQueryResult> {
  return getMatchesWithTeams({
    ...options,
    categoryId,
    seasonId,
    ownClubOnly: true,
  });
}

/**
 * Get a single match by ID
 */
export async function getMatchById(matchId: string): Promise<MatchQueryResult> {
  try {
    const supabase = createClient();
    const {data, error} = await supabase
      .from('matches')
      .select(MATCH_WITH_TEAMS_SELECT)
      .eq('id', matchId)
      .single();

    if (error) {
      return {data: [], error: error.message};
    }

    if (!data) {
      return {data: [], error: 'Match not found'};
    }

    const transformedData = transformMatchWithTeamNames(data);
    return {data: [transformedData], error: null};
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get matches organized by season (autumn/spring)
 */
export async function getMatchesBySeasonSplit(
  categoryId?: string,
  seasonId?: string,
  options: Omit<MatchQueryOptions, 'categoryId' | 'seasonId'> = {}
): Promise<SeasonalMatchQueryResult> {
  try {
    const result = await getMatchesWithTeams({
      ...options,
      categoryId,
      seasonId,
    });

    if (result.error) {
      return {autumn: [], spring: [], error: result.error};
    }

    // Split matches into autumn (Sep-Feb) and spring (Mar-May)
    const autumn: Match[] = [];
    const spring: Match[] = [];

    result.data.forEach((match: Match) => {
      const month = new Date(match.date).getMonth() + 1; // 1-12

      if (month >= 9 || month <= 2) {
        // September (9) to February (2)
        autumn.push(match);
      } else if (month >= 3 && month <= 5) {
        // March (3) to May (5)
        spring.push(match);
      }
    });

    return {autumn, spring, error: null};
  } catch (error) {
    return {
      autumn: [],
      spring: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get upcoming matches (status = 'upcoming')
 */
export async function getUpcomingMatches(
  categoryId?: string,
  seasonId?: string,
  options: Omit<MatchQueryOptions, 'status'> = {}
): Promise<MatchQueryResult> {
  return getMatchesWithTeams({
    ...options,
    categoryId,
    seasonId,
    status: 'upcoming',
  });
}

/**
 * Get completed matches (status = 'completed')
 */
export async function getCompletedMatches(
  categoryId?: string,
  seasonId?: string,
  options: Omit<MatchQueryOptions, 'status'> = {}
): Promise<MatchQueryResult> {
  return getMatchesWithTeams({
    ...options,
    categoryId,
    seasonId,
    status: 'completed',
  });
}

/**
 * Get matches by date range
 */
export async function getMatchesByDateRange(
  dateFrom: string,
  dateTo: string,
  categoryId?: string,
  seasonId?: string,
  options: Omit<MatchQueryOptions, 'dateFrom' | 'dateTo'> = {}
): Promise<MatchQueryResult> {
  return getMatchesWithTeams({
    ...options,
    categoryId,
    seasonId,
    dateFrom,
    dateTo,
  });
}

/**
 * Get matches by matchweek
 */
export async function getMatchesByMatchweek(
  matchweek: number,
  categoryId?: string,
  seasonId?: string,
  options: Omit<MatchQueryOptions, 'matchweek'> = {}
): Promise<MatchQueryResult> {
  return getMatchesWithTeams({
    ...options,
    categoryId,
    seasonId,
    matchweek,
  });
}
