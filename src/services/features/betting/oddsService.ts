import {generateMatchOdds, validateOdds} from '@/services';
import {
  BettingOdd,
  calculateImpliedProbabilityFromOdds,
  MatchOdds,
  OddsGenerationInput,
  OddsHistory,
  OddsSource,
} from '@/types';
import {supabaseBrowserClient} from '@/utils';

/**
 * Odds Service
 * Manages odds storage, retrieval, and updates in the database
 */

/**
 * Save generated odds to database
 * @param matchOdds Match odds to save
 * @param source Source of the odds (CALCULATED, MANUAL, EXTERNAL_API)
 * @param margin Bookmaker margin used
 * @returns Success status
 */
export async function saveOddsToDatabase(
  matchOdds: MatchOdds,
  source: OddsSource = 'CALCULATED',
  margin: number = 0.05
): Promise<boolean> {
  const supabase = supabaseBrowserClient();

  try {
    // First, mark any existing active odds as expired
    const now = new Date().toISOString();
    await supabase
      .from('betting_odds')
      .update({effective_until: now})
      .eq('match_id', matchOdds.match_id)
      .is('effective_until', null);

    // Prepare odds entries
    const oddsEntries: Array<{
      match_id: string;
      bet_type: string;
      selection: string;
      odds: number;
      parameter: string | null;
      source: string;
      bookmaker_margin: number;
      implied_probability: number;
      effective_from: string;
    }> = [];

    // Add 1X2 odds
    Object.entries(matchOdds['1X2']).forEach(([selection, oddsValue]) => {
      oddsEntries.push({
        match_id: matchOdds.match_id,
        bet_type: '1X2',
        selection: selection,
        odds: oddsValue,
        parameter: null,
        source,
        bookmaker_margin: margin,
        implied_probability: Number(calculateImpliedProbabilityFromOdds(oddsValue).toFixed(2)),
        effective_from: now,
      });
    });

    // Add Double Chance odds
    if (matchOdds.DOUBLE_CHANCE) {
      Object.entries(matchOdds.DOUBLE_CHANCE).forEach(([selection, oddsValue]) => {
        oddsEntries.push({
          match_id: matchOdds.match_id,
          bet_type: 'DOUBLE_CHANCE',
          selection: selection,
          odds: oddsValue,
          parameter: null,
          source,
          bookmaker_margin: margin,
          implied_probability: Number(calculateImpliedProbabilityFromOdds(oddsValue).toFixed(2)),
          effective_from: now,
        });
      });
    }

    // Add Both Teams Score odds
    if (matchOdds.BOTH_TEAMS_SCORE) {
      Object.entries(matchOdds.BOTH_TEAMS_SCORE).forEach(([selection, oddsValue]) => {
        oddsEntries.push({
          match_id: matchOdds.match_id,
          bet_type: 'BOTH_TEAMS_SCORE',
          selection: selection,
          odds: oddsValue,
          parameter: null,
          source,
          bookmaker_margin: margin,
          implied_probability: Number(calculateImpliedProbabilityFromOdds(oddsValue).toFixed(2)),
          effective_from: now,
        });
      });
    }

    // Add Over/Under odds
    if (matchOdds.OVER_UNDER) {
      const line = matchOdds.OVER_UNDER.line?.toString() || '2.5';
      Object.entries(matchOdds.OVER_UNDER).forEach(([selection, oddsValue]) => {
        if (selection !== 'line' && typeof oddsValue === 'number') {
          oddsEntries.push({
            match_id: matchOdds.match_id,
            bet_type: 'OVER_UNDER',
            selection: selection,
            odds: oddsValue,
            parameter: line,
            source,
            bookmaker_margin: margin,
            implied_probability: Number(calculateImpliedProbabilityFromOdds(oddsValue).toFixed(2)),
            effective_from: now,
          });
        }
      });
    }

    // Insert all odds
    const {error} = await supabase.from('betting_odds').insert(oddsEntries);

    if (error) {
      console.error('Error saving odds to database:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveOddsToDatabase:', error);
    return false;
  }
}

/**
 * Get current odds for a match
 * @param matchId Match ID
 * @returns Match odds or null
 */
export async function getOddsForMatch(matchId: string): Promise<MatchOdds | null> {
  const supabase = supabaseBrowserClient();

  try {
    // Get active odds (no effective_until date)
    const {data: oddsData, error} = await supabase
      .from('betting_odds')
      .select('*')
      .eq('match_id', matchId)
      .is('effective_until', null)
      .order('created_at', {ascending: false});

    if (error || !oddsData || oddsData.length === 0) {
      return null;
    }

    // Structure the odds
    const matchOdds: MatchOdds = {
      match_id: matchId,
      '1X2': {'1': 0, X: 0, '2': 0},
      last_updated: oddsData[0].created_at,
    };

    oddsData.forEach((odd: any) => {
      switch (odd.bet_type) {
        case '1X2':
          matchOdds['1X2'][odd.selection as '1' | 'X' | '2'] = odd.odds;
          break;

        case 'DOUBLE_CHANCE':
          if (!matchOdds.DOUBLE_CHANCE) {
            matchOdds.DOUBLE_CHANCE = {'1X': 0, X2: 0, '12': 0};
          }
          matchOdds.DOUBLE_CHANCE[odd.selection as '1X' | 'X2' | '12'] = odd.odds;
          break;

        case 'BOTH_TEAMS_SCORE':
          if (!matchOdds.BOTH_TEAMS_SCORE) {
            matchOdds.BOTH_TEAMS_SCORE = {YES: 0, NO: 0};
          }
          matchOdds.BOTH_TEAMS_SCORE[odd.selection as 'YES' | 'NO'] = odd.odds;
          break;

        case 'OVER_UNDER':
          if (!matchOdds.OVER_UNDER) {
            matchOdds.OVER_UNDER = {OVER: 0, UNDER: 0, line: parseFloat(odd.parameter || '2.5')};
          }
          matchOdds.OVER_UNDER[odd.selection as 'OVER' | 'UNDER'] = odd.odds;
          break;
      }
    });

    return matchOdds;
  } catch (error) {
    console.error('Error in getOddsForMatch:', error);
    return null;
  }
}

/**
 * Generate and save odds for a match
 * @param input Odds generation input
 * @returns Success status
 */
export async function generateAndSaveOdds(input: OddsGenerationInput): Promise<boolean> {
  try {
    // Generate odds
    const result = await generateMatchOdds(input);

    if (!result) {
      console.error('Failed to generate odds');
      return false;
    }

    // Validate odds
    const validation = validateOdds(result.odds);
    if (!validation.isValid) {
      console.error('Generated odds are invalid:', validation.errors);
      return false;
    }

    // Save to database
    const saved = await saveOddsToDatabase(
      result.odds,
      'CALCULATED',
      input.bookmaker_margin || 0.05
    );

    return saved;
  } catch (error) {
    console.error('Error in generateAndSaveOdds:', error);
    return false;
  }
}

/**
 * Update odds for a match (regenerate)
 * @param matchId Match ID
 * @param homeTeamId Home team ID
 * @param awayTeamId Away team ID
 * @param margin Optional bookmaker margin
 * @returns Success status
 */
export async function updateMatchOdds(
  matchId: string,
  homeTeamId: string,
  awayTeamId: string,
  margin?: number
): Promise<boolean> {
  return generateAndSaveOdds({
    match_id: matchId,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    bookmaker_margin: margin || 0.05,
  });
}

/**
 * Lock odds for a match (when match starts)
 * @param matchId Match ID
 * @returns Success status
 */
export async function lockOdds(matchId: string): Promise<boolean> {
  const supabase = supabaseBrowserClient();

  try {
    const now = new Date().toISOString();

    // Mark all active odds as expired
    const {error} = await supabase
      .from('betting_odds')
      .update({effective_until: now})
      .eq('match_id', matchId)
      .is('effective_until', null);

    if (error) {
      console.error('Error locking odds:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in lockOdds:', error);
    return false;
  }
}

/**
 * Get odds history for a match
 * @param matchId Match ID
 * @param limit Number of history entries to return
 * @returns Array of odds history
 */
export async function getOddsHistory(matchId: string, limit: number = 50): Promise<OddsHistory[]> {
  const supabase = supabaseBrowserClient();

  try {
    const {data, error} = await supabase
      .from('betting_odds_history')
      .select('*')
      .eq('match_id', matchId)
      .order('changed_at', {ascending: false})
      .limit(limit);

    if (error) {
      console.error('Error fetching odds history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getOddsHistory:', error);
    return [];
  }
}

/**
 * Generate odds for all upcoming matches
 * @param dayLimit Only generate for matches within X days (default: 7)
 * @returns Number of matches processed
 */
export async function generateOddsForUpcomingMatches(dayLimit: number = 7): Promise<number> {
  const supabase = supabaseBrowserClient();

  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + dayLimit);

    // Get upcoming matches
    const {data: matches, error} = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, date')
      .eq('status', 'upcoming')
      .gte('date', today.toISOString())
      .lte('date', futureDate.toISOString());

    if (error || !matches || matches.length === 0) {
      return 0;
    }

    let successCount = 0;

    for (const match of matches) {
      const success = await generateAndSaveOdds({
        match_id: match.id,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        bookmaker_margin: 0.05,
      });

      if (success) {
        successCount++;
      }

      // Small delay to avoid overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return successCount;
  } catch (error) {
    console.error('Error in generateOddsForUpcomingMatches:', error);
    return 0;
  }
}

/**
 * Check if match has odds
 * @param matchId Match ID
 * @returns True if odds exist
 */
export async function hasOdds(matchId: string): Promise<boolean> {
  const supabase = supabaseBrowserClient();

  try {
    const {count, error} = await supabase
      .from('betting_odds')
      .select('id', {count: 'exact', head: true})
      .eq('match_id', matchId)
      .is('effective_until', null);

    if (error) {
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Delete odds for a match
 * @param matchId Match ID
 * @returns Success status
 */
export async function deleteOdds(matchId: string): Promise<boolean> {
  const supabase = supabaseBrowserClient();

  try {
    const {error} = await supabase.from('betting_odds').delete().eq('match_id', matchId);

    if (error) {
      console.error('Error deleting odds:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteOdds:', error);
    return false;
  }
}

/**
 * Get all matches with odds
 * @param limit Number of matches to return
 * @returns Array of match IDs
 */
export async function getMatchesWithOdds(limit: number = 100): Promise<string[]> {
  const supabase = supabaseBrowserClient();

  try {
    const {data, error} = await supabase
      .from('betting_odds')
      .select('match_id')
      .is('effective_until', null)
      .order('created_at', {ascending: false})
      .limit(limit);

    if (error) {
      console.error('Error fetching matches with odds:', error);
      return [];
    }

    // Get unique match IDs
    const matchIds = data?.map((item: BettingOdd) => item.match_id) || [];
    return [...new Set(matchIds)] as string[];
  } catch (error) {
    console.error('Error in getMatchesWithOdds:', error);
    return [];
  }
}
