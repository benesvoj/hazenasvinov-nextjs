import {BetSelection, BetTypeId} from '@/types';

export interface BettingOdd {
  id: string;
  match_id: string;
  bet_type: BetTypeId;
  selection: BetSelection;
  odds: number;
  parameter?: string | null;
  source?: string | null;
  bookmaker_margin?: number | null;
  implied_probability?: number | null;
  effective_from?: string | null;
  effective_until?: string | null;
  created_at: string;
  updated_at: string;
  previous_odds?: number | null;
  odds_change_percentage?: number | null;
}
