import {Member} from './member';

export interface Lineup {
  id: string;
  match_id: string;
  team_id: string;
  is_home_team: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExternalPlayer {
  id: string;
  registration_number: string;
  name: string;
  surname: string;
  position: string;
  created_at: string;
  updated_at: string;
}

export interface LineupPlayer {
  id?: string;
  lineup_id?: string;
  member_id?: string;
  // Legacy external player fields (deprecated - use unified player system)
  external_name?: string;
  external_surname?: string;
  external_registration_number?: string;
  display_name?: string;
  is_external?: boolean;
  // Unified player system fields
  position: string;
  role?: string;
  is_captain?: boolean;
  jersey_number?: number;
  goals?: number;
  yellow_cards?: number;
  red_cards_5min?: number;
  red_cards_10min?: number;
  red_cards_personal?: number;
  // Enhanced player information
  player?: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
    is_external: boolean;
    current_club_name?: string;
    position?: string;
  };
}

export interface LineupCoach {
  id: string;
  lineup_id: string;
  member_id: string;
  role: 'head_coach' | 'assistant_coach' | 'goalkeeper_coach';
  created_at: string;
  updated_at: string;
  // Extended fields for display
  member?: Member;
  member_name?: string;
  member_surname?: string;
}

export interface LineupSummary {
  total_players: number;
  goalkeepers: number;
  field_players: number;
  coaches: number;
  is_valid: boolean;
}

export interface LineupFormData {
  match_id: string;
  team_id: string;
  is_home_team: boolean;
  players: LineupPlayerFormData[];
  coaches: LineupCoachFormData[];
}

export interface LineupPlayerFormData {
  member_id?: string;
  external_name?: string;
  external_surname?: string;
  external_registration_number?: string;
  display_name?: string;
  is_external?: boolean;
  position: string;
  role?: string;
  is_captain?: boolean;
  jersey_number?: number;
  goals?: number;
  yellow_cards?: number;
  red_cards_5min?: number;
  red_cards_10min?: number;
  red_cards_personal?: number;
}

export interface LineupCoachFormData {
  member_id: string;
  role: 'head_coach' | 'assistant_coach' | 'goalkeeper_coach';
}

export interface LineupValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
