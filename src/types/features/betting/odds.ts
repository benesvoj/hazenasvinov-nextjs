import {BetTypeId, BetSelection} from './betType';

/**
 * Odds System Types
 */

// Odds source type
export type OddsSource = 'MANUAL' | 'CALCULATED' | 'EXTERNAL_API';

// Individual odds entry
export interface Odds {
  id: string;
  match_id: string;
  bet_type: BetTypeId;
  selection: BetSelection;
  odds: number;
  parameter?: string | null;
  source: OddsSource;
  bookmaker_margin: number;
  implied_probability: number;
  effective_from: string;
  effective_until?: string | null;
  created_at: string;
  updated_at: string;
  previous_odds?: number | null;
  odds_change_percentage?: number | null;
}

// Odds history entry
export interface OddsHistory {
  id: string;
  odds_id: string;
  match_id: string;
  bet_type: BetTypeId;
  selection: BetSelection;
  old_odds: number;
  new_odds: number;
  change_percentage: number;
  changed_at: string;
  reason: string;
}

// Structured odds for a match
export interface MatchOdds {
  match_id: string;
  '1X2': {
    '1': number;
    X: number;
    '2': number;
  };
  BOTH_TEAMS_SCORE?: {
    YES: number;
    NO: number;
  };
  OVER_UNDER?: {
    OVER: number;
    UNDER: number;
    line?: number; // e.g., 2.5
  };
  last_updated: string;
}

// Team statistics for odds calculation
export interface TeamStats {
  team_id: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
  home_record: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goals_scored: number;
    goals_conceded: number;
  };
  away_record: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goals_scored: number;
    goals_conceded: number;
  };
  // Calculated metrics
  win_rate: number;
  draw_rate: number;
  loss_rate: number;
  avg_goals_scored: number;
  avg_goals_conceded: number;
  form: string; // e.g., "WWDLW" (last 5 matches)
}

// Match probabilities
export interface MatchProbabilities {
  home_win: number;
  draw: number;
  away_win: number;
  over_2_5: number;
  under_2_5: number;
  both_teams_score: number;
  home_expected_goals: number;
  away_expected_goals: number;
}

// Odds generation input
export interface OddsGenerationInput {
  match_id: string;
  home_team_id: string;
  away_team_id: string;
  bookmaker_margin?: number; // Default: 0.05 (5%)
  use_form?: boolean; // Consider recent form
  form_weight?: number; // Weight of recent form (0-1)
}

// Odds generation result
export interface OddsGenerationResult {
  match_id: string;
  odds: MatchOdds;
  probabilities: MatchProbabilities;
  stats: {
    home_team: TeamStats;
    away_team: TeamStats;
  };
  margin: number;
  generated_at: string;
}

// Odds validation result
export interface OddsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  margin?: number;
  hasArbitrage?: boolean;
}

// Helper to calculate implied probability from odds
export function calculateImpliedProbabilityFromOdds(odds: number): number {
  if (odds <= 0) return 0;
  return (1 / odds) * 100;
}

// Helper to calculate bookmaker margin
export function calculateMargin(oddsArray: number[]): number {
  if (!oddsArray || oddsArray.length === 0) return 0;

  const totalProbability = oddsArray.reduce((sum, odds) => {
    return sum + 1 / odds;
  }, 0);

  return (totalProbability - 1) * 100;
}

// Helper to check for arbitrage opportunity
export function hasArbitrageOpportunity(oddsArray: number[]): boolean {
  const totalProbability = oddsArray.reduce((sum, odds) => sum + 1 / odds, 0);
  return totalProbability < 1;
}
