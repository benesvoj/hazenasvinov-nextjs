import {Nullish, TeamBettingData, BetSelection, BetTypeId, OddsFormat} from '@/types';

// Bet status
export type BetStatus =
  | 'PENDING' // Waiting for match result
  | 'WON' // Bet won
  | 'LOST' // Bet lost
  | 'VOID' // Bet cancelled/void
  | 'CASHOUT'; // Cashed out early

// Bet structure type
export type BetStructure =
  | 'SINGLE' // Single bet on one match
  | 'ACCUMULATOR' // Multiple bets combined (all must win)
  | 'SYSTEM'; // System bet (e.g., 3 from 4)

// Individual bet leg (for accumulators)
export interface BetLeg {
  id: string;
  bet_id: string;
  match_id: string;
  bet_type: BetTypeId;
  selection: BetSelection;
  odds: number;
  parameter?: string | Nullish; // e.g., "2.5" for OVER_UNDER 2.5 goals
  status: BetStatus;
  result_determined_at?: string | Nullish;
  // Match info for display
  home_team?: string;
  away_team?: string;
  match_date?: string;
}

// Main bet record
export interface Bet {
  id: string;
  user_id: string;
  structure: BetStructure;
  stake: number; // Amount wagered
  odds: number; // Final combined odds
  potential_return: number; // stake * odds
  status: BetStatus;
  placed_at: string;
  settled_at?: string | Nullish;
  payout?: number | Nullish; // Actual payout (0 for lost, potential_return for won)
  legs: BetLeg[]; // Array of bet legs
  // System bet specific
  system_type?: string | Nullish; // e.g., "3/4" (3 from 4)
  // Cashout specific
  cashout_value?: number | Nullish;
  cashed_out_at?: string | Nullish;
}

// Input for creating a new bet
export interface CreateBetInput {
  user_id: string;
  structure: BetStructure;
  stake: number;
  legs: CreateBetLegInput[];
  system_type?: string; // For system bets
}

// Input for creating a bet leg
export interface CreateBetLegInput {
  match_id: string;
  bet_type: BetTypeId;
  selection: BetSelection;
  odds: number;
  parameter?: string;
}

// Bet validation result
export interface BetValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Bet slip item (for UI state before placing bet)
export interface BetSlipItem {
  match_id: string;
  bet_type: BetTypeId;
  selection: BetSelection;
  odds: number;
  parameter?: string;
  // Display info
  home_team: string;
  away_team: string;
  match_date: string;
  competition: string;
}

// Bet statistics for a user
export interface UserBetStats {
  total_bets: number;
  pending_bets: number;
  won_bets: number;
  lost_bets: number;
  void_bets: number;
  total_staked: number;
  total_returned: number;
  net_profit: number;
  win_rate: number; // Percentage of won bets
  average_odds: number;
  roi: number; // Return on investment percentage
}

// Bet history filters
export interface BetHistoryFilters {
  status?: BetStatus[];
  structure?: BetStructure[];
  match_id?: string;
  date_from?: string;
  date_to?: string;
  min_stake?: number;
  max_stake?: number;
}

// Helper to get bet status color
export function getBetStatusColor(status: BetStatus): 'success' | 'danger' | 'warning' | 'default' {
  switch (status) {
    case 'WON':
      return 'success';
    case 'LOST':
      return 'danger';
    case 'PENDING':
      return 'warning';
    case 'VOID':
    case 'CASHOUT':
      return 'default';
    default:
      return 'default';
  }
}

// Helper to get bet status label
export function getBetStatusLabel(status: BetStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'WON':
      return 'Won';
    case 'LOST':
      return 'Lost';
    case 'VOID':
      return 'Void';
    case 'CASHOUT':
      return 'Cashed Out';
    default:
      return status;
  }
}

// Helper to calculate potential profit
export function calculateProfit(stake: number, odds: number): number {
  return stake * odds - stake;
}

// Helper to format odds based on format
export function formatOdds(odds: number, format: OddsFormat = 'DECIMAL'): string {
  switch (format) {
    case 'DECIMAL':
      return odds.toFixed(2);
    case 'FRACTIONAL':
      // Convert decimal to fractional (simplified)
      const numerator = Math.round((odds - 1) * 100);
      const denominator = 100;
      return `${numerator}/${denominator}`;
    case 'AMERICAN':
      // Convert decimal to American odds
      if (odds >= 2) {
        return `+${Math.round((odds - 1) * 100)}`;
      } else {
        return `-${Math.round(100 / (odds - 1))}`;
      }
    default:
      return odds.toFixed(2);
  }
}
