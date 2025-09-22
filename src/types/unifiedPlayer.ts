import {Member} from './member';
import {PlayerLoan} from './playerLoan';

export interface UnifiedPlayer extends Member {
  // Club information
  core_club_name?: string;
  current_club_name?: string;

  // Active loan information
  active_loan_id?: string;
  loan_start_date?: string;
  loan_end_date?: string;
  loan_type?: 'temporary' | 'permanent' | 'youth';
  loan_status?: 'active' | 'expired' | 'terminated';
}

export interface PlayerSearchFilters {
  search_term?: string;
  club_id?: string;
  is_external?: boolean;
  position?: string;
  is_active?: boolean;
  has_active_loan?: boolean;
  category_id?: string;
}

export interface PlayerSearchResult {
  id: string;
  registration_number: string;
  name: string;
  surname: string;
  is_external: boolean;
  current_club_name?: string;
  position?: string;
  jersey_number?: number;
  display_name: string;
  is_captain?: boolean;
}

export interface PlayerWithLoans extends UnifiedPlayer {
  loans: PlayerLoan[];
}

export interface PlayerStats {
  player_id: string;
  total_matches: number;
  total_goals: number;
  total_assists: number;
  total_yellow_cards: number;
  total_red_cards: number;
  current_club_matches: number;
  loan_matches: number;
}

export interface ClubPlayerSummary {
  club_id: string;
  club_name: string;
  total_players: number;
  internal_players: number;
  external_players: number;
  loaned_in_players: number;
  loaned_out_players: number;
}
