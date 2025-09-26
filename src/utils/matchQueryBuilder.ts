import {createClient} from '@/utils/supabase/client';
import {Match} from '@/types';
import {transformMatchWithTeamNames} from '@/utils/teamDisplay';
import {getClubTeamCounts} from '@/services/optimizedMatchQueries';

// Enhanced query options with more granular control
export interface MatchQueryBuilderOptions {
  // Basic filters
  categoryId?: string;
  seasonId?: string;
  status?: 'upcoming' | 'completed' | 'cancelled';
  matchweek?: number;

  // Date filters
  dateFrom?: string;
  dateTo?: string;
  dateRange?: {
    from: string;
    to: string;
  };

  // Team filters
  homeTeamId?: string;
  awayTeamId?: string;
  teamId?: string; // Either home or away team
  ownClubOnly?: boolean;

  // Score filters
  hasScore?: boolean;
  homeScoreMin?: number;
  homeScoreMax?: number;
  awayScoreMin?: number;
  awayScoreMax?: number;

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: 'date' | 'matchweek' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';

  // Data inclusion
  includeTeamDetails?: boolean;
  includeCategory?: boolean;
  includeSeason?: boolean;
  includeStandings?: boolean;

  // Special filters
  upcomingOnly?: boolean;
  completedOnly?: boolean;
  withScores?: boolean;
  withoutScores?: boolean;
  hasMatchweek?: boolean;
  withoutMatchweek?: boolean;
}

export interface MatchQueryBuilderResult {
  data: Match[];
  error: string | null;
  count?: number;
  hasMore?: boolean;
}

export interface SeasonalMatchQueryBuilderResult {
  autumn: Match[];
  spring: Match[];
  error: string | null;
  count?: number;
}

// Query selectors
const BASIC_SELECT = `
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

const TEAM_DETAILS_SELECT = `
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

const CATEGORY_SELECT = `
  category:categories(
    id,
    name,
    description,
    age_group,
    gender
  )
`;

const SEASON_SELECT = `
  season:seasons(
    id,
    name,
    start_date,
    end_date,
    is_active
  )
`;

/**
 * Fluent API for building match queries
 */
export class MatchQueryBuilder {
  private options: MatchQueryBuilderOptions;
  private supabase: any;

  constructor(options: MatchQueryBuilderOptions = {}) {
    this.options = {...options};
    this.supabase = createClient();
  }

  // Filter methods
  category(categoryId: string): MatchQueryBuilder {
    this.options.categoryId = categoryId;
    return this;
  }

  season(seasonId: string): MatchQueryBuilder {
    this.options.seasonId = seasonId;
    return this;
  }

  status(status: 'upcoming' | 'completed' | 'cancelled'): MatchQueryBuilder {
    this.options.status = status;
    return this;
  }

  matchweek(matchweek: number): MatchQueryBuilder {
    this.options.matchweek = matchweek;
    return this;
  }

  dateRange(from: string, to: string): MatchQueryBuilder {
    this.options.dateFrom = from;
    this.options.dateTo = to;
    return this;
  }

  homeTeam(teamId: string): MatchQueryBuilder {
    this.options.homeTeamId = teamId;
    return this;
  }

  awayTeam(teamId: string): MatchQueryBuilder {
    this.options.awayTeamId = teamId;
    return this;
  }

  team(teamId: string): MatchQueryBuilder {
    this.options.teamId = teamId;
    return this;
  }

  ownClubOnly(): MatchQueryBuilder {
    this.options.ownClubOnly = true;
    return this;
  }

  withScores(): MatchQueryBuilder {
    this.options.withScores = true;
    return this;
  }

  withoutScores(): MatchQueryBuilder {
    this.options.withoutScores = true;
    return this;
  }

  upcomingOnly(): MatchQueryBuilder {
    this.options.upcomingOnly = true;
    return this;
  }

  completedOnly(): MatchQueryBuilder {
    this.options.completedOnly = true;
    return this;
  }

  hasMatchweek(): MatchQueryBuilder {
    this.options.hasMatchweek = true;
    return this;
  }

  withoutMatchweek(): MatchQueryBuilder {
    this.options.withoutMatchweek = true;
    return this;
  }

  // Pagination methods
  limit(count: number): MatchQueryBuilder {
    this.options.limit = count;
    return this;
  }

  offset(count: number): MatchQueryBuilder {
    this.options.offset = count;
    return this;
  }

  // Sorting methods
  sortBy(
    field: 'date' | 'matchweek' | 'created_at' | 'updated_at',
    order: 'asc' | 'desc' = 'asc'
  ): MatchQueryBuilder {
    this.options.sortBy = field;
    this.options.sortOrder = order;
    return this;
  }

  // Data inclusion methods
  includeTeamDetails(): MatchQueryBuilder {
    this.options.includeTeamDetails = true;
    return this;
  }

  includeCategory(): MatchQueryBuilder {
    this.options.includeCategory = true;
    return this;
  }

  includeSeason(): MatchQueryBuilder {
    this.options.includeSeason = true;
    return this;
  }

  includeStandings(): MatchQueryBuilder {
    this.options.includeStandings = true;
    return this;
  }

  // Score filtering methods
  homeScoreRange(min: number, max: number): MatchQueryBuilder {
    this.options.homeScoreMin = min;
    this.options.homeScoreMax = max;
    return this;
  }

  awayScoreRange(min: number, max: number): MatchQueryBuilder {
    this.options.awayScoreMin = min;
    this.options.awayScoreMax = max;
    return this;
  }

  /**
   * Build the select clause based on options
   */
  private buildSelectClause(): string {
    let select = BASIC_SELECT;

    if (this.options.includeTeamDetails) {
      select += `,${TEAM_DETAILS_SELECT}`;
    }

    if (this.options.includeCategory) {
      select += `,${CATEGORY_SELECT}`;
    }

    if (this.options.includeSeason) {
      select += `,${SEASON_SELECT}`;
    }

    return select;
  }

  /**
   * Apply filters to the query
   */
  private applyFilters(query: any): any {
    // Basic filters
    if (this.options.categoryId) {
      query = query.eq('category_id', this.options.categoryId);
    }

    if (this.options.seasonId) {
      query = query.eq('season_id', this.options.seasonId);
    }

    if (this.options.status) {
      query = query.eq('status', this.options.status);
    }

    if (this.options.matchweek !== undefined) {
      query = query.eq('matchweek', this.options.matchweek);
    }

    // Date filters
    if (this.options.dateFrom) {
      query = query.gte('date', this.options.dateFrom);
    }

    if (this.options.dateTo) {
      query = query.lte('date', this.options.dateTo);
    }

    // Team filters
    if (this.options.homeTeamId) {
      query = query.eq('home_team_id', this.options.homeTeamId);
    }

    if (this.options.awayTeamId) {
      query = query.eq('away_team_id', this.options.awayTeamId);
    }

    if (this.options.teamId) {
      query = query.or(
        `home_team_id.eq.${this.options.teamId},away_team_id.eq.${this.options.teamId}`
      );
    }

    // Score filters
    if (this.options.withScores) {
      query = query.not('home_score', 'is', null).not('away_score', 'is', null);
    }

    if (this.options.withoutScores) {
      query = query.or('home_score.is.null,away_score.is.null');
    }

    if (this.options.homeScoreMin !== undefined) {
      query = query.gte('home_score', this.options.homeScoreMin);
    }

    if (this.options.homeScoreMax !== undefined) {
      query = query.lte('home_score', this.options.homeScoreMax);
    }

    if (this.options.awayScoreMin !== undefined) {
      query = query.gte('away_score', this.options.awayScoreMin);
    }

    if (this.options.awayScoreMax !== undefined) {
      query = query.lte('away_score', this.options.awayScoreMax);
    }

    // Special filters
    if (this.options.upcomingOnly) {
      query = query.eq('status', 'upcoming');
    }

    if (this.options.completedOnly) {
      query = query.eq('status', 'completed');
    }

    if (this.options.hasMatchweek) {
      query = query.not('matchweek', 'is', null);
    }

    if (this.options.withoutMatchweek) {
      query = query.is('matchweek', null);
    }

    return query;
  }

  /**
   * Apply sorting to the query
   */
  private applySorting(query: any): any {
    const sortBy = this.options.sortBy || 'date';
    const sortOrder = this.options.sortOrder || 'asc';

    return query.order(sortBy, {ascending: sortOrder === 'asc'});
  }

  /**
   * Apply pagination to the query
   */
  private applyPagination(query: any): any {
    if (this.options.limit) {
      query = query.limit(this.options.limit);
    }

    if (this.options.offset) {
      const limit = this.options.limit || 10;
      query = query.range(this.options.offset, this.options.offset + limit - 1);
    }

    return query;
  }

  /**
   * Execute the query and return results
   */
  async execute(): Promise<MatchQueryBuilderResult> {
    try {
      let query = this.supabase.from('matches').select(this.buildSelectClause());

      // Apply all filters
      query = this.applyFilters(query);

      // Apply sorting
      query = this.applySorting(query);

      // Apply pagination
      query = this.applyPagination(query);

      const {data, error, count} = await query;

      if (error) {
        return {data: [], error: error.message};
      }

      let matches = data || [];

      // Transform team names if team details are included
      if (this.options.includeTeamDetails) {
        // Get team counts for proper suffix display
        let clubTeamCounts = new Map<string, number>();

        if (this.options.seasonId) {
          try {
            if (this.options.categoryId) {
              // Single category - get team counts for that category
              clubTeamCounts = await getClubTeamCounts(
                this.options.categoryId,
                this.options.seasonId
              );
            } else {
              // All category - get team counts for all category that have matches
              const categoryIds = [
                ...new Set(matches.map((match: any) => match.category_id)),
              ].filter((id): id is string => typeof id === 'string');
              const allTeamCounts = await Promise.all(
                categoryIds.map((categoryId: string) =>
                  getClubTeamCounts(categoryId, this.options.seasonId!)
                )
              );

              // Merge all team counts into one map
              allTeamCounts.forEach((counts) => {
                counts.forEach((count, clubId) => {
                  clubTeamCounts.set(clubId, count);
                });
              });
            }
          } catch (error) {
            console.warn('Failed to get team counts for suffix logic:', error);
          }
        }

        matches = matches.map((match: any) =>
          transformMatchWithTeamNames(match, matches, {
            useTeamMap: false,
            teamDetails: matches,
            clubTeamCounts: clubTeamCounts,
          })
        );
      }

      // Filter for own club matches if requested
      if (this.options.ownClubOnly && this.options.includeTeamDetails) {
        matches = matches.filter(
          (match: Match) => match.home_team_is_own_club || match.away_team_is_own_club
        );
      }

      // Determine if there are more results
      const hasMore = this.options.limit ? matches.length === this.options.limit : false;

      return {
        data: matches,
        error: null,
        count: count || 0,
        hasMore,
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Execute query and split results by season (autumn/spring)
   */
  async executeSeasonal(): Promise<SeasonalMatchQueryBuilderResult> {
    try {
      const result = await this.execute();

      if (result.error) {
        return {autumn: [], spring: [], error: result.error};
      }

      // Split matches into autumn (Sep-Feb) and spring (Mar-May)
      const autumn: Match[] = [];
      const spring: Match[] = [];

      result.data.forEach((match: Match) => {
        const month = new Date(match.date).getMonth() + 1; // 1-12

        if (month >= 8 || month <= 2) {
          // September (9) to February (2)
          autumn.push(match);
        } else if (month >= 3 && month <= 6) {
          // March (3) to May (5)
          spring.push(match);
        }
      });

      return {
        autumn,
        spring,
        error: null,
        count: result.count,
      };
    } catch (error) {
      return {
        autumn: [],
        spring: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get a single match by ID
   */
  async getById(matchId: string): Promise<MatchQueryBuilderResult> {
    try {
      const query = this.supabase
        .from('matches')
        .select(this.buildSelectClause())
        .eq('id', matchId)
        .single();

      const {data, error} = await query;

      if (error) {
        return {data: [], error: error.message};
      }

      if (!data) {
        return {data: [], error: 'Match not found'};
      }

      let match = data;

      // Transform team names if team details are included
      if (this.options.includeTeamDetails) {
        // Get team counts for proper suffix display
        let clubTeamCounts = new Map<string, number>();

        if (this.options.seasonId) {
          try {
            if (this.options.categoryId) {
              // Single category - get team counts for that category
              clubTeamCounts = await getClubTeamCounts(
                this.options.categoryId,
                this.options.seasonId
              );
            } else {
              // All category - get team counts for the match's category
              clubTeamCounts = await getClubTeamCounts(data.category_id, this.options.seasonId);
            }
          } catch (error) {
            console.warn('Failed to get team counts for suffix logic:', error);
          }
        }

        match = transformMatchWithTeamNames(data, [data], {
          useTeamMap: false,
          teamDetails: [data],
          clubTeamCounts: clubTeamCounts,
        });
      }

      return {data: [match], error: null};
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Count matches without fetching data
   */
  async count(): Promise<{count: number; error: string | null}> {
    try {
      let query = this.supabase.from('matches').select('*', {count: 'exact', head: true});

      // Apply filters (without pagination)
      query = this.applyFilters(query);

      const {count, error} = await query;

      if (error) {
        return {count: 0, error: error.message};
      }

      return {count: count || 0, error: null};
    } catch (error) {
      return {
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

/**
 * Create a new MatchQueryBuilder instance
 */
export function createMatchQuery(options: MatchQueryBuilderOptions = {}): MatchQueryBuilder {
  return new MatchQueryBuilder(options);
}

/**
 * Convenience functions for common queries
 */
export const MatchQueries = {
  // Basic queries
  all: () => createMatchQuery(),
  byCategory: (categoryId: string) => createMatchQuery().category(categoryId),
  bySeason: (seasonId: string) => createMatchQuery().season(seasonId),
  byStatus: (status: 'upcoming' | 'completed' | 'cancelled') => createMatchQuery().status(status),

  // Own club queries
  ownClub: (categoryId?: string, seasonId?: string) =>
    createMatchQuery({categoryId, seasonId}).ownClubOnly().includeTeamDetails(),

  // Public queries
  public: (categoryId?: string) =>
    createMatchQuery({categoryId}).includeTeamDetails().includeCategory(),

  // Admin queries
  admin: (categoryId?: string, seasonId?: string) =>
    createMatchQuery({categoryId, seasonId}).includeTeamDetails().includeCategory().includeSeason(),

  // Specialized queries
  upcoming: (categoryId?: string, seasonId?: string) =>
    createMatchQuery({categoryId, seasonId}).upcomingOnly().includeTeamDetails(),

  completed: (categoryId?: string, seasonId?: string) =>
    createMatchQuery({categoryId, seasonId}).completedOnly().includeTeamDetails(),

  withScores: (categoryId?: string, seasonId?: string) =>
    createMatchQuery({categoryId, seasonId}).withScores().includeTeamDetails(),

  withoutScores: (categoryId?: string, seasonId?: string) =>
    createMatchQuery({categoryId, seasonId}).withoutScores().includeTeamDetails(),

  byMatchweek: (matchweek: number, categoryId?: string, seasonId?: string) =>
    createMatchQuery({categoryId, seasonId}).matchweek(matchweek).includeTeamDetails(),

  byDateRange: (from: string, to: string, categoryId?: string, seasonId?: string) =>
    createMatchQuery({categoryId, seasonId}).dateRange(from, to).includeTeamDetails(),
};
