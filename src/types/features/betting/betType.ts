import {translations} from '@/lib';

const t = translations.betting.betType;

// Bet type identifiers
export type BetTypeId =
  | '1X2' // Match result: Home win, Draw, Away win
  | 'DOUBLE_CHANCE' // Two outcomes covered (1X, X2, 12)
  | 'OVER_UNDER' // Goals over/under threshold
  | 'BOTH_TEAMS_SCORE' // Both teams to score
  | 'CORRECT_SCORE' // Exact final score
  | 'HALFTIME_FULLTIME' // Half-time and full-time result
  | 'FIRST_GOAL_SCORER' // Player to score first goal
  | 'HANDICAP'; // Asian handicap betting

// Selection options for each bet type
export type BetSelection =
  | '1' // Home win
  | 'X' // Draw
  | '2' // Away win
  | '1X' // Home or draw
  | 'X2' // Draw or away
  | '12' // Home or away
  | 'OVER' // Over threshold
  | 'UNDER' // Under threshold
  | 'YES' // Yes (e.g., both teams score)
  | 'NO' // No
  | string; // For dynamic selections like scores, players

// Odds format types
export type OddsFormat = 'DECIMAL' | 'FRACTIONAL' | 'AMERICAN';

// Bet type metadata
export interface BetTypeMetadata {
  id: BetTypeId;
  name: string;
  description: string;
  category: 'MAIN' | 'GOALS' | 'SCORE' | 'SPECIAL';
  requiresParameter?: boolean; // e.g., OVER_UNDER needs threshold
  availableSelections: BetSelection[];
}

// Bet type definitions
export const BET_TYPES: Record<BetTypeId, BetTypeMetadata> = {
  '1X2': {
    id: '1X2',
    name: t.matchResult,
    description: 'Predict the final result of the match',
    category: 'MAIN',
    availableSelections: ['1', 'X', '2'],
  },
  DOUBLE_CHANCE: {
    id: 'DOUBLE_CHANCE',
    name: 'Double Chance',
    description: 'Cover two of three possible outcomes',
    category: 'MAIN',
    availableSelections: ['1X', 'X2', '12'],
  },
  OVER_UNDER: {
    id: 'OVER_UNDER',
    name: 'Over/Under Goals',
    description: 'Predict if total goals will be over or under a threshold',
    category: 'GOALS',
    requiresParameter: true,
    availableSelections: ['OVER', 'UNDER'],
  },
  BOTH_TEAMS_SCORE: {
    id: 'BOTH_TEAMS_SCORE',
    name: 'Both Teams to Score',
    description: 'Predict if both teams will score',
    category: 'GOALS',
    availableSelections: ['YES', 'NO'],
  },
  CORRECT_SCORE: {
    id: 'CORRECT_SCORE',
    name: 'Correct Score',
    description: 'Predict the exact final score',
    category: 'SCORE',
    availableSelections: [], // Dynamic based on possible scores
  },
  HALFTIME_FULLTIME: {
    id: 'HALFTIME_FULLTIME',
    name: 'Half-time/Full-time',
    description: 'Predict both half-time and full-time results',
    category: 'MAIN',
    availableSelections: ['1/1', '1/X', '1/2', 'X/1', 'X/X', 'X/2', '2/1', '2/X', '2/2'],
  },
  FIRST_GOAL_SCORER: {
    id: 'FIRST_GOAL_SCORER',
    name: 'First Goal Scorer',
    description: 'Predict which player will score first',
    category: 'SPECIAL',
    availableSelections: [], // Dynamic based on players
  },
  HANDICAP: {
    id: 'HANDICAP',
    name: 'Handicap',
    description: 'Bet with a virtual advantage/disadvantage',
    category: 'MAIN',
    requiresParameter: true,
    availableSelections: ['1', '2'],
  },
};

// Helper function to get bet type metadata
export function getBetTypeMetadata(betTypeId: BetTypeId): BetTypeMetadata {
  return BET_TYPES[betTypeId];
}

// Helper function to format selection display name
export function getSelectionDisplayName(
  betTypeId: BetTypeId,
  selection: BetSelection,
  homeTeam?: string,
  awayTeam?: string
): string {
  if (betTypeId === '1X2' || betTypeId === 'DOUBLE_CHANCE') {
    if (selection === '1') return homeTeam || t.homeWin;
    if (selection === 'X') return t.draw;
    if (selection === '2') return awayTeam || t.awayWin;
    if (selection === '1X') return t.homeNotLose;
    if (selection === 'X2') return t.awayNotLose;
    if (selection === '12') return t.homeOrAwayWin;
  }

  if (betTypeId === 'BOTH_TEAMS_SCORE') {
    return selection === 'YES' ? 'Yes' : 'No';
  }

  return selection;
}
