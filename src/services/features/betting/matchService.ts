import {AgeGroups} from '@/enums';
import {MatchBettingData} from '@/types';
import {supabaseBrowserClient} from '@/utils';

/**
 * Match Service for Betting System
 * Fetches upcoming matches available for betting
 */

export interface BettingMatchOptions {
  limit?: number;
  daysAhead?: number; // How many days in the future to fetch matches
  categoryId?: string;
  seasonId?: string;
}

export interface BettingMatchResult {
  matches: MatchBettingData[];
  error: string | null;
}

/**
 * Get upcoming matches available for betting
 * Only returns matches that haven't started yet
 */
export async function getUpcomingBettingMatches(
  options: BettingMatchOptions = {}
): Promise<BettingMatchResult> {
  const {
    limit = 20,
    daysAhead = 30, // Default to matches in next 30 days
    categoryId,
    seasonId,
  } = options;

  try {
    const supabase = supabaseBrowserClient();

    // Calculate date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // First, get adult category IDs
    const {data: adultCategories} = await supabase
      .from('categories')
      .select('id')
      .eq('age_group', AgeGroups.ADULTS);

    const adultCategoryIds = adultCategories?.map((cat: {id: string}) => cat.id) || [];

    // If no adult categories found, return empty result
    if (adultCategoryIds.length === 0) {
      return {matches: [], error: null};
    }

    // Build query with all necessary joins
    let query = supabase
      .from('matches')
      .select(
        `
        id,
        date,
        time,
        venue,
        competition,
        status,
        category_id,
        season_id,
        home_team_id,
        away_team_id,
        category:categories(
          id,
          name,
          description,
          age_group
        ),
        season:seasons(
          id,
          name
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
      `
      )
      .eq('status', 'upcoming') // Only upcoming matches
      .gte('date', todayStr) // From today onwards
      .lte('date', futureDateStr) // Within the next X days
      .in('category_id', adultCategoryIds) // Only adult category IDs
      .order('date', {ascending: true})
      .order('time', {ascending: true});

    // Apply optional filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const {data, error} = await query;

    if (error) {
      console.error('Error fetching betting matches:', error);
      return {matches: [], error: error.message};
    }

    // Transform the data to match the Match type with is_home property
    const transformedMatches: MatchBettingData[] = (data || []).map((match: any) => {
      const homeClub = match.home_team?.club_category?.club;
      const awayClub = match.away_team?.club_category?.club;

      return {
        ...match,
        is_home: homeClub?.is_own_club || false,
        home_team: {
          ...match.home_team,
          club_category: match.home_team?.club_category,
        },
        away_team: {
          ...match.away_team,
          club_category: match.away_team?.club_category,
        },
      };
    });

    return {matches: transformedMatches, error: null};
  } catch (error) {
    console.error('Error in getUpcomingBettingMatches:', error);
    return {
      matches: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get a single match by ID for betting
 */
export async function getBettingMatchById(matchId: string): Promise<MatchBettingData | null> {
  try {
    const supabase = supabaseBrowserClient();

    // First, get adult category IDs
    const {data: adultCategories} = await supabase
      .from('categories')
      .select('id')
      .eq('age_group', AgeGroups.ADULTS);

    const adultCategoryIds = adultCategories?.map((cat: {id: string}) => cat.id) || [];

    // If no adult categories found, return null
    if (adultCategoryIds.length === 0) {
      return null;
    }

    const {data, error} = await supabase
      .from('matches')
      .select(
        `
        id,
        date,
        time,
        venue,
        competition,
        status,
        category_id,
        season_id,
        home_team_id,
        away_team_id,
        category:categories(
          id,
          name,
          description,
          age_group
        ),
        season:seasons(
          id,
          name
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
      `
      )
      .eq('id', matchId)
      .eq('status', 'upcoming')
      .in('category_id', adultCategoryIds) // Only adult category IDs
      .single();

    if (error || !data) {
      console.error('Error fetching betting match by ID:', error);
      return null;
    }

    const homeClub = data.home_team?.club_category?.club;

    return {
      ...data,
      home_team: {
        ...data.home_team,
        club_category: data.home_team?.club_category,
      },
      away_team: {
        ...data.away_team,
        club_category: data.away_team?.club_category,
      },
    } as MatchBettingData;
  } catch (error) {
    console.error('Error in getBettingMatchById:', error);
    return null;
  }
}

/**
 * Get upcoming matches grouped by date
 */
export async function getUpcomingMatchesByDate(
  options: BettingMatchOptions = {}
): Promise<{[date: string]: MatchBettingData[]}> {
  const {matches} = await getUpcomingBettingMatches(options);

  // Group by date
  const groupedMatches: {[date: string]: MatchBettingData[]} = {};

  matches.forEach((match) => {
    if (!groupedMatches[match.date]) {
      groupedMatches[match.date] = [];
    }
    groupedMatches[match.date].push(match);
  });

  return groupedMatches;
}
