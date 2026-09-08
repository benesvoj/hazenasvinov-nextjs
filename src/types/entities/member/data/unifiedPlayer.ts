import {Member} from '@/types';

export interface UnifiedPlayer extends Member {
  is_external?: boolean;
  core_club_id?: string;
  current_club_id?: string;
  external_club_name?: string;
  position: string;
  jersey_number?: number;
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
  /**
   * Restricts the search to several categories at once — how a coach calls up
   * players from another age group. Takes precedence over `category_id`; when
   * both are absent the search spans every category.
   */
  category_ids?: string[];
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
  /** Category the member belongs to — shown so a call-up is visible as one. */
  category_id?: string;
  category_name?: string;
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

export interface UnifiedPlayerManagerProps {
  clubId?: string;
  showExternalPlayers?: boolean;
  onPlayerSelected?: (player: PlayerSearchResult) => void;
  categoryId?: string;
  teamName?: string;
  excludePlayerIds?: string[]; // IDs of player-manager already in the lineup
  onMemberCreated?: () => void; // Callback when a new member is created
  /**
   * Offers a switch that widens the search from `categoryId` to every category
   * of the same gender, so a coach can call up a younger age group.
   */
  allowOtherCategories?: boolean;
}
