import {Nullish} from '@/types';

// Leaderboard period
export type LeaderboardPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASON' | 'ALL_TIME';

// Leaderboard sort options
export type LeaderboardSortBy = 'PROFIT' | 'ROI' | 'WIN_RATE' | 'TOTAL_BETS' | 'TOTAL_STAKED';

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string | Nullish;
  // Statistics
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  void_bets: number;
  total_staked: number;
  total_returned: number;
  net_profit: number;
  win_rate: number; // Percentage (0-100)
  roi: number; // Return on investment percentage
  average_odds: number;
  // Metadata
  period: LeaderboardPeriod;
  updated_at: string;
}

// Leaderboard query options
export interface LeaderboardQuery {
  period: LeaderboardPeriod;
  sort_by: LeaderboardSortBy;
  limit?: number;
  offset?: number;
  category_id?: string; // Filter by specific category/league
  season_id?: string; // Filter by season
}

// User rank information
export interface UserRankInfo {
  user_id: string;
  current_rank: number;
  previous_rank?: number | Nullish;
  rank_change: number; // Positive = moved up, negative = moved down
  total_users: number;
  percentile: number; // User's position as percentage (0-100)
  entry: LeaderboardEntry;
}

// Leaderboard statistics summary
export interface LeaderboardStats {
  total_users: number;
  total_bets_placed: number;
  total_amount_wagered: number;
  average_bet_size: number;
  highest_profit: number;
  highest_roi: number;
  best_win_rate: number;
}

// Helper to get period display name
export function getPeriodDisplayName(period: LeaderboardPeriod): string {
  switch (period) {
    case 'DAILY':
      return 'Today';
    case 'WEEKLY':
      return 'This Week';
    case 'MONTHLY':
      return 'This Month';
    case 'SEASON':
      return 'This Season';
    case 'ALL_TIME':
      return 'All Time';
    default:
      return period;
  }
}

// Helper to get sort by display name
export function getSortByDisplayName(sortBy: LeaderboardSortBy): string {
  switch (sortBy) {
    case 'PROFIT':
      return 'Net Profit';
    case 'ROI':
      return 'ROI %';
    case 'WIN_RATE':
      return 'Win Rate';
    case 'TOTAL_BETS':
      return 'Total Bets';
    case 'TOTAL_STAKED':
      return 'Total Staked';
    default:
      return sortBy;
  }
}

// Helper to format rank display
export function formatRank(rank: number): string {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `${rank}th`;
}

// Helper to get rank change indicator
export function getRankChangeIndicator(change: number): {icon: string; color: string} {
  if (change > 0) return {icon: '↑', color: 'success'};
  if (change < 0) return {icon: '↓', color: 'danger'};
  return {icon: '→', color: 'default'};
}

// Helper to calculate percentile
export function calculatePercentile(rank: number, totalUsers: number): number {
  if (totalUsers === 0) return 0;
  return Math.round(((totalUsers - rank + 1) / totalUsers) * 100);
}

// Helper to format percentage
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Helper to determine if user is in top tier
export function isTopTier(rank: number, totalUsers: number): boolean {
  const percentile = calculatePercentile(rank, totalUsers);
  return percentile >= 90; // Top 10%
}
