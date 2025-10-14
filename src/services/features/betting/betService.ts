import {
  Bet,
  BetLeg,
  CreateBetInput,
  BetStatus,
  BetHistoryFilters,
  UserBetStats,
  BetValidation,
} from '@/types/features/betting/bet';

import {createClient} from '@/utils/supabase/client';

import {
  calculateTotalOdds,
  calculateReturn,
  validateStake,
  deductBetStake,
  creditBetWinnings,
  refundVoidBet,
  hasSufficientBalance,
} from '@/services';

/**
 * Bet Service
 * Manages all bet-related operations including creation, retrieval, and settlement
 */

const MIN_STAKE = 1;
const MAX_STAKE = 10000;
const MIN_ODDS = 1.01;
const MAX_ODDS = 1000;
const MAX_ACCUMULATOR_LEGS = 20;

/**
 * Validate bet input before creation
 * @param input Bet creation input
 * @param userBalance User's current balance
 * @returns Validation result
 */
export function validateBet(input: CreateBetInput, userBalance: number): BetValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate stake
  const stakeValidation = validateStake(input.stake, MIN_STAKE, MAX_STAKE, userBalance);
  if (!stakeValidation.isValid) {
    errors.push(stakeValidation.error!);
  }

  // Validate legs
  if (!input.legs || input.legs.length === 0) {
    errors.push('At least one bet selection is required');
  }

  // Validate bet structure
  if (input.structure === 'SINGLE' && input.legs.length > 1) {
    errors.push('Single bets can only have one selection');
  }

  if (input.structure === 'ACCUMULATOR' && input.legs.length < 2) {
    errors.push('Accumulator bets require at least 2 selections');
  }

  if (input.legs.length > MAX_ACCUMULATOR_LEGS) {
    errors.push(`Maximum ${MAX_ACCUMULATOR_LEGS} selections allowed`);
  }

  // Validate each leg
  input.legs.forEach((leg, index) => {
    if (leg.odds < MIN_ODDS) {
      errors.push(`Selection ${index + 1}: Odds must be at least ${MIN_ODDS}`);
    }
    if (leg.odds > MAX_ODDS) {
      errors.push(`Selection ${index + 1}: Odds cannot exceed ${MAX_ODDS}`);
    }
    if (!leg.match_id) {
      errors.push(`Selection ${index + 1}: Match ID is required`);
    }
  });

  // Check for duplicate matches in accumulator
  if (input.structure === 'ACCUMULATOR') {
    const matchIds = input.legs.map((leg) => leg.match_id);
    const uniqueMatchIds = new Set(matchIds);
    if (matchIds.length !== uniqueMatchIds.size) {
      errors.push('Cannot bet on the same match multiple times in an accumulator');
    }
  }

  // Calculate total odds and warn if very high
  const totalOdds = calculateTotalOdds(input.structure, input.legs);
  if (totalOdds > 100) {
    warnings.push('Very high odds - this bet is unlikely to win');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Create a new bet
 * @param input Bet creation input
 * @returns Created bet or null if failed
 */
export async function createBet(input: CreateBetInput): Promise<Bet | null> {
  const supabase = createClient();

  try {
    // Validate sufficient balance
    const hasBalance = await hasSufficientBalance(input.user_id, input.stake);
    if (!hasBalance) {
      throw new Error('Insufficient balance');
    }

    // Calculate total odds
    const totalOdds = calculateTotalOdds(input.structure, input.legs);
    const potentialReturn = calculateReturn(input.stake, totalOdds);

    // Create bet record
    const {data: bet, error: betError} = await supabase
      .from('betting_bets')
      .insert({
        user_id: input.user_id,
        structure: input.structure,
        stake: input.stake,
        odds: totalOdds,
        potential_return: potentialReturn,
        status: 'PENDING',
        system_type: input.system_type,
      })
      .select()
      .single();

    if (betError || !bet) {
      console.error('Error creating bet:', {
        message: betError?.message,
        details: betError?.details,
        hint: betError?.hint,
        code: betError?.code,
      });
      return null;
    }

    // Fetch match data for each leg to populate team names and dates
    const legPromises = input.legs.map(async (leg) => {
      const {data: match} = await supabase
        .from('matches')
        .select(
          `
          id,
          date,
          home_team:home_team_id(club_category:club_category_id(club:club_id(name))),
          away_team:away_team_id(club_category:club_category_id(club:club_id(name)))
        `
        )
        .eq('id', leg.match_id)
        .single();

      return {
        bet_id: bet.id,
        match_id: leg.match_id,
        bet_type: leg.bet_type,
        selection: leg.selection,
        odds: leg.odds,
        parameter: leg.parameter,
        status: 'PENDING' as BetStatus,
        home_team: match?.home_team?.club_category?.club?.name || 'Home',
        away_team: match?.away_team?.club_category?.club?.name || 'Away',
        match_date: match?.date || null,
      };
    });

    const betLegs = await Promise.all(legPromises);

    const {data: createdLegs, error: legsError} = await supabase
      .from('betting_bet_legs')
      .insert(betLegs)
      .select();

    if (legsError || !createdLegs) {
      console.error('Error creating bet legs:', {
        message: legsError?.message,
        details: legsError?.details,
        hint: legsError?.hint,
        code: legsError?.code,
        betLegs,
      });
      // Rollback bet creation
      await supabase.from('betting_bets').delete().eq('id', bet.id);
      return null;
    }

    // Deduct stake from wallet
    const transaction = await deductBetStake(input.user_id, input.stake, bet.id);
    if (!transaction) {
      console.error('Error deducting stake from wallet');
      // Rollback bet and legs creation
      await supabase.from('betting_bet_legs').delete().eq('bet_id', bet.id);
      await supabase.from('betting_bets').delete().eq('id', bet.id);
      return null;
    }

    // Return complete bet with legs
    return {
      ...bet,
      legs: createdLegs,
    };
  } catch (error) {
    console.error('Error in createBet:', error);
    return null;
  }
}

/**
 * Get bet by ID
 * @param betId Bet ID
 * @returns Bet with legs
 */
export async function getBetById(betId: string): Promise<Bet | null> {
  const supabase = createClient();

  try {
    const {data: bet, error: betError} = await supabase
      .from('betting_bets')
      .select('*')
      .eq('id', betId)
      .single();

    if (betError || !bet) {
      console.error('Error fetching bet:', betError);
      return null;
    }

    const {data: legs, error: legsError} = await supabase
      .from('betting_bet_legs')
      .select('*')
      .eq('bet_id', betId);

    if (legsError) {
      console.error('Error fetching bet legs:', legsError);
      return null;
    }

    return {
      ...bet,
      legs: legs || [],
    };
  } catch (error) {
    console.error('Error in getBetById:', error);
    return null;
  }
}

/**
 * Get user's bets with optional filters
 * @param userId User ID
 * @param filters Optional filters
 * @param limit Number of bets to return
 * @param offset Pagination offset
 * @returns Array of bets
 */
export async function getUserBets(
  userId: string,
  filters?: BetHistoryFilters,
  limit: number = 50,
  offset: number = 0
): Promise<Bet[]> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('betting_bets')
      .select(
        `
        *,
        betting_bet_legs(
          id,
          bet_id,
          match_id,
          bet_type,
          selection,
          odds,
          parameter,
          status,
          result_determined_at,
          home_team,
          away_team,
          match_date
        )
      `
      )
      .eq('user_id', userId)
      .order('placed_at', {ascending: false});

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters?.structure && filters.structure.length > 0) {
      query = query.in('structure', filters.structure);
    }

    if (filters?.min_stake) {
      query = query.gte('stake', filters.min_stake);
    }

    if (filters?.max_stake) {
      query = query.lte('stake', filters.max_stake);
    }

    if (filters?.date_from) {
      query = query.gte('placed_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('placed_at', filters.date_to);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const {data, error} = await query;

    if (error) {
      console.error('Error fetching user bets:', error);
      return [];
    }

    // Transform data to match Bet type and fetch missing team names if needed
    const bets =
      data?.map((bet: any) => ({
        ...bet,
        legs: bet.betting_bet_legs || [],
      })) || [];

    // Check if any legs are missing team names and fetch them if needed
    const betsWithMissingData = bets.filter((bet: Bet) =>
      bet.legs.some((leg) => !leg.home_team || !leg.away_team)
    );

    if (betsWithMissingData.length > 0) {
      // Fetch match data for legs with missing team names
      for (const bet of betsWithMissingData) {
        for (const leg of bet.legs) {
          if (!leg.home_team || !leg.away_team) {
            const {data: match} = await supabase
              .from('matches')
              .select(
                `
                id,
                date,
                home_team:home_team_id(club_category:club_category_id(club:club_id(name))),
                away_team:away_team_id(club_category:club_category_id(club:club_id(name)))
              `
              )
              .eq('id', leg.match_id)
              .single();

            if (match) {
              leg.home_team = match.home_team?.club_category?.club?.name || 'Home';
              leg.away_team = match.away_team?.club_category?.club?.name || 'Away';
              leg.match_date = match.date || leg.match_date;
            }
          }
        }
      }
    }

    return bets;
  } catch (error) {
    console.error('Error in getUserBets:', error);
    return [];
  }
}

/**
 * Get active (pending) bets for a user
 * @param userId User ID
 * @returns Array of pending bets
 */
export async function getActiveBets(userId: string): Promise<Bet[]> {
  return getUserBets(userId, {status: ['PENDING']});
}

/**
 * Settle a bet (mark as won, lost, or void)
 * @param betId Bet ID
 * @param status Final status (WON, LOST, VOID)
 * @returns Updated bet
 */
export async function settleBet(
  betId: string,
  status: 'WON' | 'LOST' | 'VOID'
): Promise<Bet | null> {
  const supabase = createClient();

  try {
    // Get bet details
    const bet = await getBetById(betId);
    if (!bet) {
      throw new Error('Bet not found');
    }

    if (bet.status !== 'PENDING') {
      throw new Error('Bet is already settled');
    }

    // Calculate payout
    let payout = 0;
    if (status === 'WON') {
      payout = bet.potential_return;
      // Credit winnings to wallet
      await creditBetWinnings(bet.user_id, payout, betId);
    } else if (status === 'VOID') {
      payout = bet.stake; // Refund stake
      await refundVoidBet(bet.user_id, bet.stake, betId);
    }
    // For LOST, payout remains 0

    // Update bet status
    const {data: updatedBet, error} = await supabase
      .from('betting_bets')
      .update({
        status: status,
        settled_at: new Date().toISOString(),
        payout: payout,
      })
      .eq('id', betId)
      .select()
      .single();

    if (error) {
      console.error('Error settling bet:', error);
      return null;
    }

    // Get updated legs
    const {data: legs} = await supabase.from('betting_bet_legs').select('*').eq('bet_id', betId);

    return {
      ...updatedBet,
      legs: legs || [],
    };
  } catch (error) {
    console.error('Error in settleBet:', error);
    return null;
  }
}

/**
 * Settle a bet leg
 * @param legId Leg ID
 * @param status Status (WON, LOST, VOID)
 * @returns Updated leg
 */
export async function settleBetLeg(
  legId: string,
  status: 'WON' | 'LOST' | 'VOID'
): Promise<BetLeg | null> {
  const supabase = createClient();

  try {
    const {data, error} = await supabase
      .from('betting_bet_legs')
      .update({
        status: status,
        result_determined_at: new Date().toISOString(),
      })
      .eq('id', legId)
      .select()
      .single();

    if (error) {
      console.error('Error settling bet leg:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in settleBetLeg:', error);
    return null;
  }
}

/**
 * Check and settle accumulator bet based on leg results
 * @param betId Bet ID
 * @returns Updated bet or null
 */
export async function checkAndSettleAccumulator(betId: string): Promise<Bet | null> {
  const bet = await getBetById(betId);
  if (!bet || bet.structure !== 'ACCUMULATOR' || bet.status !== 'PENDING') {
    return null;
  }

  const allLegsSettled = bet.legs.every((leg) => leg.status !== 'PENDING');
  if (!allLegsSettled) {
    return null; // Wait for all legs to be settled
  }

  // Check if all legs won
  const hasLostLeg = bet.legs.some((leg) => leg.status === 'LOST');
  const hasVoidLeg = bet.legs.some((leg) => leg.status === 'VOID');

  let finalStatus: 'WON' | 'LOST' | 'VOID';

  if (hasLostLeg) {
    finalStatus = 'LOST';
  } else if (hasVoidLeg) {
    finalStatus = 'VOID'; // Simplified: void entire bet if any leg is void
  } else {
    finalStatus = 'WON'; // All legs won
  }

  return settleBet(betId, finalStatus);
}

/**
 * Get user betting statistics
 * @param userId User ID
 * @returns User bet stats
 */
export async function getUserBetStats(userId: string): Promise<UserBetStats | null> {
  const supabase = createClient();

  try {
    const {data: bets, error} = await supabase
      .from('betting_bets')
      .select('status, stake, payout, odds')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user bet stats:', error);
      return null;
    }

    const stats: UserBetStats = {
      total_bets: bets?.length || 0,
      pending_bets: bets?.filter((b: Bet) => b.status === 'PENDING').length || 0,
      won_bets: bets?.filter((b: Bet) => b.status === 'WON').length || 0,
      lost_bets: bets?.filter((b: Bet) => b.status === 'LOST').length || 0,
      void_bets: bets?.filter((b: Bet) => b.status === 'VOID').length || 0,
      total_staked: bets?.reduce((sum: number, b: Bet) => sum + b.stake, 0) || 0,
      total_returned: bets?.reduce((sum: number, b: Bet) => sum + (b.payout || 0), 0) || 0,
      net_profit: 0,
      win_rate: 0,
      average_odds: 0,
      roi: 0,
    };

    stats.net_profit = stats.total_returned - stats.total_staked;

    const settledBets = stats.won_bets + stats.lost_bets;
    if (settledBets > 0) {
      stats.win_rate = (stats.won_bets / settledBets) * 100;
    }

    if (bets && bets.length > 0) {
      stats.average_odds = bets.reduce((sum: number, b: Bet) => sum + b.odds, 0) / bets.length;
    }

    if (stats.total_staked > 0) {
      stats.roi = (stats.net_profit / stats.total_staked) * 100;
    }

    return stats;
  } catch (error) {
    console.error('Error in getUserBetStats:', error);
    return null;
  }
}

/**
 * Cancel a pending bet (admin function)
 * @param betId Bet ID
 * @returns Success status
 */
export async function cancelBet(betId: string): Promise<boolean> {
  try {
    const bet = await getBetById(betId);
    if (!bet || bet.status !== 'PENDING') {
      return false;
    }

    // Settle as void (will refund stake)
    const settled = await settleBet(betId, 'VOID');
    return settled !== null;
  } catch (error) {
    console.error('Error in cancelBet:', error);
    return false;
  }
}

/**
 * Get bets for a specific match
 * @param matchId Match ID
 * @returns Array of bets
 */
export async function getBetsForMatch(matchId: string): Promise<Bet[]> {
  const supabase = createClient();

  try {
    const {data: legs, error: legsError} = await supabase
      .from('betting_bet_legs')
      .select('bet_id')
      .eq('match_id', matchId);

    if (legsError || !legs) {
      console.error('Error fetching bets for match:', legsError);
      return [];
    }

    const betIds = [...new Set(legs.map((leg: BetLeg) => leg.bet_id))];

    if (betIds.length === 0) {
      return [];
    }

    type Bets = {
      id: string;
      bet_id: string;
      match_id: string;
      bet_type: string;
      selection: string;
      odds: number;
      parameter?: string;
      status: BetStatus;
      result_determined_at?: string;
      home_team?: string;
      away_team?: string;
      match_date?: string;
      betting_bet_legs?: BetLeg[];
    };

    const {data: bets, error: betsError} = await supabase
      .from('betting_bets')
      .select('*, betting_bet_legs(*)')
      .in('id', betIds);

    if (betsError) {
      console.error('Error fetching bets:', betsError);
      return [];
    }

    return (
      bets?.map((bet: Bets) => ({
        ...bet,
        legs: bet.betting_bet_legs || [],
      })) || []
    );
  } catch (error) {
    console.error('Error in getBetsForMatch:', error);
    return [];
  }
}
