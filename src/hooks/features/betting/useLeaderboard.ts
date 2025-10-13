import {useQuery} from '@tanstack/react-query';

import {createClient} from '@/utils/supabase/client';

import {
  LeaderboardEntry,
  LeaderboardQuery,
  UserRankInfo,
  LeaderboardStats,
  LeaderboardPeriod,
  LeaderboardSortBy,
  calculatePercentile,
  Bet,
} from '@/types';

/**
 * Get leaderboard entries
 */
async function getLeaderboard(query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
  const supabase = createClient();

  try {
    // This would typically query a materialized view or aggregated table
    // For now, we'll calculate from betting_bets table
    const {data: bets, error} = await supabase
      .from('betting_bets')
      .select('user_id, status, stake, payout, odds');

    if (error) {
      console.error('Error fetching leaderboard data:', error);
      return [];
    }

    // Aggregate by user
    const userStats = new Map<
      string,
      {
        total_bets: number;
        won_bets: number;
        lost_bets: number;
        void_bets: number;
        total_staked: number;
        total_returned: number;
        total_odds: number;
      }
    >();

    bets?.forEach((bet: Bet) => {
      const stats = userStats.get(bet.user_id) || {
        total_bets: 0,
        won_bets: 0,
        lost_bets: 0,
        void_bets: 0,
        total_staked: 0,
        total_returned: 0,
        total_odds: 0,
      };

      stats.total_bets++;
      stats.total_staked += bet.stake;
      stats.total_returned += bet.payout || 0;
      stats.total_odds += bet.odds;

      if (bet.status === 'WON') stats.won_bets++;
      if (bet.status === 'LOST') stats.lost_bets++;
      if (bet.status === 'VOID') stats.void_bets++;

      userStats.set(bet.user_id, stats);
    });

    // Convert to leaderboard entries
    const entries: LeaderboardEntry[] = Array.from(userStats.entries()).map(([user_id, stats]) => {
      const net_profit = stats.total_returned - stats.total_staked;
      const settledBets = stats.won_bets + stats.lost_bets;
      const win_rate = settledBets > 0 ? (stats.won_bets / settledBets) * 100 : 0;
      const roi = stats.total_staked > 0 ? (net_profit / stats.total_staked) * 100 : 0;
      const average_odds = stats.total_bets > 0 ? stats.total_odds / stats.total_bets : 0;

      return {
        rank: 0, // Will be set after sorting
        user_id,
        username: user_id, // TODO: Join with user profiles
        total_bets: stats.total_bets,
        won_bets: stats.won_bets,
        lost_bets: stats.lost_bets,
        void_bets: stats.void_bets,
        total_staked: stats.total_staked,
        total_returned: stats.total_returned,
        net_profit,
        win_rate,
        roi,
        average_odds,
        period: query.period,
        updated_at: new Date().toISOString(),
      };
    });

    // Sort by selected criteria
    entries.sort((a, b) => {
      switch (query.sort_by) {
        case 'PROFIT':
          return b.net_profit - a.net_profit;
        case 'ROI':
          return b.roi - a.roi;
        case 'WIN_RATE':
          return b.win_rate - a.win_rate;
        case 'TOTAL_BETS':
          return b.total_bets - a.total_bets;
        case 'TOTAL_STAKED':
          return b.total_staked - a.total_staked;
        default:
          return b.net_profit - a.net_profit;
      }
    });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Apply pagination
    const start = query.offset || 0;
    const end = start + (query.limit || 50);
    return entries.slice(start, end);
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    return [];
  }
}

/**
 * Get user's rank information
 */
async function getUserRank(
  userId: string,
  period: LeaderboardPeriod
): Promise<UserRankInfo | null> {
  const supabase = createClient();

  try {
    // Get all users for ranking
    const allEntries = await getLeaderboard({
      period,
      sort_by: 'PROFIT',
      limit: 10000, // Get all users
    });

    const userEntry = allEntries.find((e) => e.user_id === userId);
    if (!userEntry) return null;

    return {
      user_id: userId,
      current_rank: userEntry.rank,
      rank_change: 0, // TODO: Calculate from historical data
      total_users: allEntries.length,
      percentile: calculatePercentile(userEntry.rank, allEntries.length),
      entry: userEntry,
    };
  } catch (error) {
    console.error('Error in getUserRank:', error);
    return null;
  }
}

/**
 * Get leaderboard statistics
 */
async function getLeaderboardStats(period: LeaderboardPeriod): Promise<LeaderboardStats | null> {
  const supabase = createClient();

  try {
    const {data: bets, error} = await supabase
      .from('betting_bets')
      .select('stake, payout, user_id');

    if (error) {
      console.error('Error fetching leaderboard stats:', error);
      return null;
    }

    const uniqueUsers = new Set(bets?.map((b: Bet) => b.user_id) || []).size;
    const totalBets: number = bets?.length || 0;
    const totalWagered: number = bets?.reduce((sum: number, b: Bet) => sum + b.stake, 0) || 0;
    const averageBetSize: number = totalBets > 0 ? totalWagered / totalBets : 0;

    // Get entries for additional stats
    const entries = await getLeaderboard({period, sort_by: 'PROFIT', limit: 1000});

    const highestProfit = entries.length > 0 ? Math.max(...entries.map((e) => e.net_profit)) : 0;
    const highestROI = entries.length > 0 ? Math.max(...entries.map((e) => e.roi)) : 0;
    const bestWinRate = entries.length > 0 ? Math.max(...entries.map((e) => e.win_rate)) : 0;

    return {
      total_users: uniqueUsers,
      total_bets_placed: totalBets,
      total_amount_wagered: totalWagered,
      average_bet_size: averageBetSize,
      highest_profit: highestProfit,
      highest_roi: highestROI,
      best_win_rate: bestWinRate,
    };
  } catch (error) {
    console.error('Error in getLeaderboardStats:', error);
    return null;
  }
}

/**
 * Hook to get leaderboard
 */
export function useLeaderboard(
  period: LeaderboardPeriod = 'ALL_TIME',
  sortBy: LeaderboardSortBy = 'PROFIT',
  limit: number = 50,
  offset: number = 0
) {
  const query: LeaderboardQuery = {
    period,
    sort_by: sortBy,
    limit,
    offset,
  };

  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', period, sortBy, limit, offset],
    queryFn: () => getLeaderboard(query),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get user's rank
 */
export function useUserRank(userId: string, period: LeaderboardPeriod = 'ALL_TIME') {
  return useQuery<UserRankInfo | null>({
    queryKey: ['leaderboard', 'rank', userId, period],
    queryFn: () => getUserRank(userId, period),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get leaderboard statistics
 */
export function useLeaderboardStats(period: LeaderboardPeriod = 'ALL_TIME') {
  return useQuery<LeaderboardStats | null>({
    queryKey: ['leaderboard', 'stats', period],
    queryFn: () => getLeaderboardStats(period),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
